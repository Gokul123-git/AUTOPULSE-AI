import express from 'express';
import { protect } from '../middleware/auth.js';
import { getHealth } from '../controllers/apiController.js';

const router = express.Router();

router.get('/', protect, getHealth);

export default router;
