import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getMe,
  login,
  logout,
  register,
  refreshToken,
  updatePassword,
  updateProfile,
} from '../controllers/authController.js';
import { restoreUserData } from '../controllers/userDataController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.get('/me', protect, getMe);
router.put('/me', protect, updateProfile);
router.put('/password', protect, updatePassword);
router.post('/logout', protect, logout);
router.get('/restore', protect, restoreUserData);

export default router;
