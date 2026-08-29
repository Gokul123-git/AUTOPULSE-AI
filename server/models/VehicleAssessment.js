import mongoose from 'mongoose';

const vehicleAssessmentSchema = new mongoose.Schema({
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
  source: { type: String, enum: ['manual', 'csv', 'xlsx', 'json', 'api', 'obd_iot'], default: 'manual' },
  completeness: { type: Number, required: true, min: 0, max: 100 },
  missingFields: [String],
  analysedAt: Date,
  analysis: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

vehicleAssessmentSchema.index({ vehicle: 1, createdAt: -1 });
export default mongoose.model('VehicleAssessment', vehicleAssessmentSchema);
