import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
} from '../controllers/invoiceController.js';

const router = express.Router();

router.get('/', protect, getInvoices);
router.get('/:id', protect, getInvoiceById);
router.post('/', protect, createInvoice);
router.put('/:id', protect, updateInvoice);
router.delete('/:id', protect, deleteInvoice);

export default router;
