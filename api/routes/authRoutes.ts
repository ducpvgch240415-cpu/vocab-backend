import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';

import {
  getCurrentUser,
  login,
  logout,
  register,
} from '../controllers/authController';
import { authenticate } from '../middleware/authenticate';

const router = Router();

const authenticationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    message:
      'Too many authentication attempts. Please try again later.',
  },
});

router.post(
  '/register',
  authenticationLimiter,
  register,
);

router.post(
  '/login',
  authenticationLimiter,
  login,
);

router.post('/logout', logout);

router.get('/me', authenticate, getCurrentUser);

export default router;