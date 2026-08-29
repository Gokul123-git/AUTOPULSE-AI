import express from 'express';
import { protect } from '../middleware/auth.js';
import { getMetrics } from '../controllers/apiController.js';

const router = express.Router();

router.get('/', protect, getMetrics);

export default router;
