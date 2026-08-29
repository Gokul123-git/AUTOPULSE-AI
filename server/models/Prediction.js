import mongoose from 'mongoose';

const predictionSchema = new mongoose.Schema(
  {
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: {
      type: String,
      enum: [
        'engine_failure', 'battery_failure', 'brake_wear', 'tyre_wear',
        'transmission_problem', 'cooling_system', 'oil_replacement',
        'fuel_consumption', 'maintenance_cost', 'remaining_useful_life',
      ],
      required: true,
    },
    riskPercentage: { type: Number, required: true, min: 0, max: 100 },
    confidenceScore: { type: Number, required: true, min: 0, max: 100 },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low',
    },
    reason: { type: String },
    recommendedAction: { type: String },
    estimatedRepairCost: { type: Number },
    estimatedTimeBeforeFailure: { type: Number }, // in days
    modelVersion: { type: String },
    inputFeatures: { type: mongoose.Schema.Types.Mixed },
    rawResponse: { type: mongoose.Schema.Types.Mixed },
    isAcknowledged: { type: Boolean, default: false },
    acknowledgedAt: { type: Date },
    validUntil: { type: Date },
    status: {
      type: String,
      enum: ['active', 'resolved', 'dismissed', 'expired'],
      default: 'active',
    },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'MaintenanceRecord' },
  },
  { timestamps: true }
);

predictionSchema.index({ vehicle: 1, category: 1, createdAt: -1 });
predictionSchema.index({ owner: 1, status: 1 });

const Prediction = mongoose.model('Prediction', predictionSchema);
export default Prediction;
