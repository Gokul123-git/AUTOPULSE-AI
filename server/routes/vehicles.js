import express from 'express';
import { protect } from '../middleware/auth.js';
import { uploadImageFields } from '../middleware/upload.js';
import {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehicleHealth,
} from '../controllers/vehicleController.js';

const router = express.Router();

router.get('/', protect, getVehicles);
const vehicleImages = uploadImageFields([{ name: 'images', maxCount: 5 }, { name: 'image', maxCount: 1 }]);

router.post('/', protect, vehicleImages, createVehicle);
router.get('/:id/health', protect, getVehicleHealth);
router.get('/:id', protect, getVehicleById);
router.put('/:id', protect, vehicleImages, updateVehicle);
router.delete('/:id', protect, deleteVehicle);

export default router;
