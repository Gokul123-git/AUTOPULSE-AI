import express from 'express';
import { protect } from '../middleware/auth.js';
import { createHealthReading, getHealthReadings } from '../controllers/healthReadingController.js';

const router = express.Router();
router.use(protect);
router.get('/', getHealthReadings);
router.post('/', createHealthReading);
export default router;
