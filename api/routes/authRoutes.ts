import express from 'express';
import {
  register,
  login,
  logout,
  me,
  googleLogin
} from '../controllers/authController';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/google', googleLogin);
router.get('/me', me);

export default router;