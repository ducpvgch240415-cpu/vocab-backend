import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'development-secret';

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const token = req.cookies.token;

  if (!token) {
    res.status(401).json({
      message: 'Please login first',
    });
    return;
  }

  try {
    jwt.verify(token, SECRET);

    next();
  } catch {
    res.status(401).json({
      message: 'Invalid login',
    });
  }
};