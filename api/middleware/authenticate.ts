import type { RequestHandler } from 'express';

import User from '../models/userModel';

import {
  AUTH_COOKIE_NAME,
  clearAuthCookie,
  verifyAccessToken,
} from '../utils/authentication';

export const authenticate: RequestHandler =
  async (
    request,
    response,
    next,
  ): Promise<void> => {
    const token = request.cookies?.[
      AUTH_COOKIE_NAME
    ] as string | undefined;

    if (!token) {
      response.status(401).json({
        message: 'Authentication required',
      });

      return;
    }

    let userId: string;

    try {
      userId = verifyAccessToken(token);
    } catch {
      clearAuthCookie(response);

      response.status(401).json({
        message:
          'Authentication is invalid or expired',
      });

      return;
    }

    try {
      const user = await User.findById(
        userId,
      ).select('name email role');

      if (!user) {
        clearAuthCookie(response);

        response.status(401).json({
          message: 'Administrator not found',
        });

        return;
      }

      request.user = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      };

      next();
    } catch (error) {
      next(error);
    }
  };