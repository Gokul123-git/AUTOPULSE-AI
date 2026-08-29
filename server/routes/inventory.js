import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getInventory,
  getInventoryById,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
} from '../controllers/inventoryController.js';

const router = express.Router();

router.get('/', protect, getInventory);
router.get('/:id', protect, getInventoryById);
router.post('/', protect, createInventoryItem);
router.put('/:id', protect, updateInventoryItem);
router.delete('/:id', protect, deleteInventoryItem);

export default router;
