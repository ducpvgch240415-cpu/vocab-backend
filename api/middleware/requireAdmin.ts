import type { RequestHandler } from 'express';

export const requireAdmin: RequestHandler = (
  request,
  response,
  next,
): void => {
  if (!request.user) {
    response.status(401).json({
      message: 'Authentication required',
    });

    return;
  }

  if (request.user.role !== 'admin') {
    response.status(403).json({
      message:
        'Administrator permission required',
    });

    return;
  }

  next();
};