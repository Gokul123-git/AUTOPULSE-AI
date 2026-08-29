import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  createMaintenanceRecord,
  deleteMaintenanceRecord,
  getMaintenanceById,
  getMaintenanceRecords,
  getRecommendations,
  updateMaintenanceRecord,
} from '../controllers/maintenanceController.js';

const router = express.Router();
router.use(protect);
router.get('/recommendations', getRecommendations);
router.get('/', getMaintenanceRecords);
router.post('/', createMaintenanceRecord);
router.get('/:id', getMaintenanceById);
router.put('/:id', updateMaintenanceRecord);
router.delete('/:id', deleteMaintenanceRecord);

export default router;
