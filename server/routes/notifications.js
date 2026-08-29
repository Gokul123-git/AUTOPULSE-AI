import express from 'express';
import { protect } from '../middleware/auth.js';
import { getNotifications, markAsRead, createNotification, deleteNotification } from '../controllers/notificationController.js';

const router = express.Router();

router.get('/', protect, getNotifications);
router.post('/', protect, createNotification);
router.put('/:id/read', protect, markAsRead);
router.delete('/:id', protect, deleteNotification);

export default router;
