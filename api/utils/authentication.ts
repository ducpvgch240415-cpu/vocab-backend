import type {
  CookieOptions,
  Response,
} from 'express';

import jwt, {
  type JwtPayload,
  type SignOptions,
} from 'jsonwebtoken';

export const AUTH_COOKIE_NAME = 'admin_session';

const THIRTY_DAYS_IN_MS =
  30 * 24 * 60 * 60 * 1000;

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      'JWT_SECRET is not configured',
    );
  }

  return secret;
}

function getSameSiteValue():
  | 'lax'
  | 'strict'
  | 'none' {
  const value =
    process.env.COOKIE_SAME_SITE?.toLowerCase();

  if (value === 'strict') {
    return 'strict';
  }

  if (value === 'none') {
    return 'none';
  }

  return 'lax';
}

function getBaseCookieOptions(): CookieOptions {
  const sameSite = getSameSiteValue();

  return {
    httpOnly: true,

    secure:
      process.env.NODE_ENV === 'production' ||
      sameSite === 'none',

    sameSite,
    path: '/',
  };
}

export function createAccessToken(
  userId: string,
  rememberMe: boolean,
): string {
  const expiresIn: SignOptions['expiresIn'] =
    rememberMe ? '30d' : '8h';

  return jwt.sign(
    {
      sub: userId,
    },
    getJwtSecret(),
    {
      algorithm: 'HS256',
      expiresIn,
    },
  );
}

export function verifyAccessToken(
  token: string,
): string {
  const decoded = jwt.verify(
    token,
    getJwtSecret(),
    {
      algorithms: ['HS256'],
    },
  );

  if (typeof decoded === 'string') {
    throw new Error('Invalid token payload');
  }

  const payload = decoded as JwtPayload;

  if (typeof payload.sub !== 'string') {
    throw new Error('Token subject is missing');
  }

  return payload.sub;
}

export function setAuthCookie(
  response: Response,
  token: string,
  rememberMe: boolean,
): void {
  const options = getBaseCookieOptions();

  if (rememberMe) {
    options.maxAge = THIRTY_DAYS_IN_MS;
  }

  /*
   * No maxAge is added when rememberMe is false.
   * This creates a browser-session cookie.
   */
  response.cookie(
    AUTH_COOKIE_NAME,
    token,
    options,
  );
}

export function clearAuthCookie(
  response: Response,
): void {
  const options = getBaseCookieOptions();

  response.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: options.httpOnly,
    secure: options.secure,
    sameSite: options.sameSite,
    path: options.path,
  });
}