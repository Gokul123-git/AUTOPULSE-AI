import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getServiceCenters,
  getServiceCenterById,
  createServiceCenter,
  updateServiceCenter,
  deleteServiceCenter,
} from '../controllers/serviceCenterController.js';

const router = express.Router();

router.get('/', protect, getServiceCenters);
router.get('/:id', protect, getServiceCenterById);
router.post('/', protect, createServiceCenter);
router.put('/:id', protect, updateServiceCenter);
router.delete('/:id', protect, deleteServiceCenter);

export default router;
