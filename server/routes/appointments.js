import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} from '../controllers/appointmentController.js';

const router = express.Router();

router.get('/', protect, getAppointments);
router.get('/:id', protect, getAppointmentById);
router.post('/', protect, createAppointment);
router.put('/:id', protect, updateAppointment);
router.delete('/:id', protect, deleteAppointment);

export default router;
