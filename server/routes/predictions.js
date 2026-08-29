import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getPredictions,
  createPrediction,
  updatePrediction,
  deletePrediction,
  runPrediction,
} from '../controllers/predictionController.js';

const router = express.Router();

router.get('/', protect, getPredictions);
router.post('/', protect, createPrediction);
router.post('/analyze', protect, runPrediction);
router.put('/:id', protect, updatePrediction);
router.delete('/:id', protect, deletePrediction);

export default router;
