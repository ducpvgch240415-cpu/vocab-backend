import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/userModel';
import { OAuth2Client } from 'google-auth-library';

const SECRET = process.env.JWT_SECRET || 'development-secret';


const googleClient = new OAuth2Client();

export const googleLogin = async (
  req: Request,
  res: Response
  
): Promise<void> => {
  
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
if (!GOOGLE_CLIENT_ID) {
  throw new Error('GOOGLE_CLIENT_ID is not configured');
}
  try {
    const { credential } = req.body;

    const ticket = await googleClient.verifyIdToken({
  idToken: credential,
  audience: GOOGLE_CLIENT_ID,
});

    const payload = ticket.getPayload();

    if (!payload?.email) {
      res.status(401).json({
        message: 'Google login failed',
      });
      return;
    }

    let user = await User.findOne({
      email: payload.email,
    });

    // Create user automatically
    if (!user) {
      user = new User({
        email: payload.email,
      });

      await user.save();
    }

    const token = jwt.sign(
      { userId: user._id },
      SECRET,
      { expiresIn: '1d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    res.json({
      message: 'Google login successful',
    });

  } catch {
    res.status(401).json({
      message: 'Google login failed',
    });
  }
};

// REGISTER
export const register = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      res.status(400).json({
        message: 'User already exists',
      });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      email,
      password: hashedPassword,
    });

    await user.save();

    res.status(201).json({
      message: 'User registered successfully',
    });
  } catch {
    res.status(500).json({
      message: 'Registration failed',
    });
  }
};


// LOGIN
export const login = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      res.status(401).json({
        message: 'Invalid email or password',
      });
      return;
    }

    const correctPassword = await bcrypt.compare(
      password,
      user.password
    );

    if (!correctPassword) {
      res.status(401).json({
        message: 'Invalid email or password',
      });
      return;
    }

    const token = jwt.sign(
      { userId: user._id },
      SECRET,
      { expiresIn: '1d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      message: 'Login successful',
      user: {
        email: user.email,
      },
    });
  } catch {
    res.status(500).json({
      message: 'Login failed',
    });
  }
};


// LOGOUT
export const logout = (
  _req: Request,
  res: Response
): void => {
  res.clearCookie('token');

  res.json({
    message: 'Logged out',
  });
};

export const me = async (
  req: Request,
  res: Response
): Promise<void> => {
  const token = req.cookies?.token;

  if (!token) {
    res.status(401).json({
      message: 'Not logged in'
    });
    return;
  }

  try {
    jwt.verify(token, SECRET);

    res.json({
      loggedIn: true
    });
  } catch {
    res.status(401).json({
      message: 'Invalid login'
    });
  }
};
