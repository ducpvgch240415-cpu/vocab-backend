import bcrypt from 'bcrypt';

import type { RequestHandler } from 'express';

import { OAuth2Client } from 'google-auth-library';

import User, {
  type UserDocument,
} from '../models/userModel';

import {
  isApprovedAdminEmail,
  isCorrectRegistrationCode,
  normaliseEmail,
} from '../utils/adminAccess';

import {
  clearAuthCookie,
  createAccessToken,
  setAuthCookie,
} from '../utils/authentication';

const PASSWORD_SALT_ROUNDS = 12;

const emailPattern =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const googleClient = new OAuth2Client();

function getGoogleClientId(): string {
  const clientId =
    process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    throw new Error(
      'GOOGLE_CLIENT_ID is not configured',
    );
  }

  return clientId;
}

function isDuplicateKeyError(
  error: unknown,
): error is { code: number } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: number }).code === 11000
  );
}

function publicUser(user: UserDocument) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

/*
 * POST /api/auth/register
 */
export const register: RequestHandler =
  async (
    request,
    response,
    next,
  ): Promise<void> => {
    try {
      const name = String(
        request.body.name ?? '',
      ).trim();

      const email = normaliseEmail(
        request.body.email,
      );

      const password = String(
        request.body.password ?? '',
      );

      const registrationCode =
        request.body.registrationCode;

      const rememberMe =
        request.body.rememberMe === true;

      if (
        name.length < 2 ||
        name.length > 80
      ) {
        response.status(400).json({
          message:
            'Name must contain between 2 and 80 characters',
        });

        return;
      }

      if (!emailPattern.test(email)) {
        response.status(400).json({
          message:
            'Enter a valid email address',
        });

        return;
      }

      if (
        password.length < 8 ||
        password.length > 128
      ) {
        response.status(400).json({
          message:
            'Password must contain between 8 and 128 characters',
        });

        return;
      }

      if (!isApprovedAdminEmail(email)) {
        response.status(403).json({
          message:
            'This email is not approved as an administrator',
        });

        return;
      }

      if (
        !isCorrectRegistrationCode(
          registrationCode,
        )
      ) {
        response.status(403).json({
          message:
            'The administrator registration code is incorrect',
        });

        return;
      }

      const existingUser =
        await User.findOne({ email });

      if (existingUser) {
        response.status(409).json({
          message:
            'An account with this email already exists',
        });

        return;
      }

      const passwordHash =
        await bcrypt.hash(
          password,
          PASSWORD_SALT_ROUNDS,
        );

      const user = await User.create({
        name,
        email,
        passwordHash,
        role: 'admin',
      });

      const token = createAccessToken(
        user._id.toString(),
        rememberMe,
      );

      setAuthCookie(
        response,
        token,
        rememberMe,
      );

      response.status(201).json({
        message:
          'Administrator account created successfully',

        user: publicUser(user),
      });
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        response.status(409).json({
          message:
            'An account with this email already exists',
        });

        return;
      }

      next(error);
    }
  };

/*
 * POST /api/auth/login
 */
export const login: RequestHandler =
  async (
    request,
    response,
    next,
  ): Promise<void> => {
    try {
      const email = normaliseEmail(
        request.body.email,
      );

      const password = String(
        request.body.password ?? '',
      );

      const rememberMe =
        request.body.rememberMe === true;

      if (!email || !password) {
        response.status(400).json({
          message:
            'Email and password are required',
        });

        return;
      }

      const user = await User.findOne({
        email,
      }).select('+passwordHash');

      /*
       * Keep the error general so the API does not
       * reveal whether the email exists.
       */
      if (!user?.passwordHash) {
        response.status(401).json({
          message:
            'Invalid email or password',
        });

        return;
      }

      const passwordMatches =
        await bcrypt.compare(
          password,
          user.passwordHash,
        );

      if (!passwordMatches) {
        response.status(401).json({
          message:
            'Invalid email or password',
        });

        return;
      }

      const token = createAccessToken(
        user._id.toString(),
        rememberMe,
      );

      setAuthCookie(
        response,
        token,
        rememberMe,
      );

      response.status(200).json({
        message: 'Login successful',
        user: publicUser(user),
      });
    } catch (error) {
      next(error);
    }
  };

/*
 * POST /api/auth/google
 *
 * The first successful Google request creates
 * the administrator account.
 *
 * Later requests log in to the existing account.
 */
export const googleAuthentication:
  RequestHandler = async (
  request,
  response,
  next,
): Promise<void> => {
  try {
    const credential = String(
      request.body.credential ?? '',
    );

    const rememberMe =
      request.body.rememberMe === true;

    if (!credential) {
      response.status(400).json({
        message:
          'Google credential is required',
      });

      return;
    }

    const ticket =
      await googleClient.verifyIdToken({
        idToken: credential,
        audience: getGoogleClientId(),
      });

    const payload = ticket.getPayload();

    if (
      !payload?.sub ||
      !payload.email ||
      payload.email_verified !== true
    ) {
      response.status(401).json({
        message:
          'The Google account could not be verified',
      });

      return;
    }

    const email = normaliseEmail(
      payload.email,
    );

    if (!isApprovedAdminEmail(email)) {
      response.status(403).json({
        message:
          'This Google account is not approved as an administrator',
      });

      return;
    }

    let user = await User.findOne({
  email,
});

if (!user) {
  const fallbackName =
    email.split('@')[0] ?? 'Admin';

  const adminName =
    payload.name?.trim() || fallbackName;

  user = await User.create({
    name: adminName,
    email,
    googleId: payload.sub,
    role: 'admin',
  });
} else {
  let changed = false;

  if (!user.googleId) {
    user.googleId = payload.sub;
    changed = true;
  }

  if (
    payload.name &&
    user.name !== payload.name
  ) {
    user.name = payload.name;
    changed = true;
  }

  if (changed) {
    await user.save();
  }
}

    const token = createAccessToken(
      user._id.toString(),
      rememberMe,
    );

    setAuthCookie(
      response,
      token,
      rememberMe,
    );

    response.status(200).json({
      message:
        'Google authentication successful',

      user: publicUser(user),
    });
  } catch (error) {
    console.error(
      'Google authentication error:',
      error,
    );

    response.status(401).json({
      message:
        'Google authentication failed',
    });
  }
};

/*
 * GET /api/auth/me
 */
export const getCurrentUser:
  RequestHandler = (
  request,
  response,
): void => {
  if (!request.user) {
    response.status(401).json({
      message: 'Authentication required',
    });

    return;
  }

  response.status(200).json({
    user: request.user,
  });
};

/*
 * POST /api/auth/logout
 */
export const logout: RequestHandler = (
  _request,
  response,
): void => {
  clearAuthCookie(response);

  response.status(200).json({
    message: 'Logout successful',
  });
};