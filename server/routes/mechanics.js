import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getMechanics,
  getMechanicById,
  createMechanic,
  updateMechanic,
  deleteMechanic,
} from '../controllers/mechanicController.js';

const router = express.Router();

router.get('/', protect, getMechanics);
router.get('/:id', protect, getMechanicById);
router.post('/', protect, createMechanic);
router.put('/:id', protect, updateMechanic);
router.delete('/:id', protect, deleteMechanic);

export default router;
