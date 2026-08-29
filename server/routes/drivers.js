import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver,
} from '../controllers/driverController.js';

const router = express.Router();

router.get('/', protect, getDrivers);
router.get('/:id', protect, getDriverById);
router.post('/', protect, createDriver);
router.put('/:id', protect, updateDriver);
router.delete('/:id', protect, deleteDriver);

export default router;
