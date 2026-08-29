import mongoose from 'mongoose';

const telemetryPointSchema = new mongoose.Schema({
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  latitude: { type: Number, required: true, min: -90, max: 90 }, longitude: { type: Number, required: true, min: -180, max: 180 },
  speed: { type: Number, min: 0, default: 0 }, heading: { type: Number, min: 0, max: 360 }, address: String,
  capturedAt: { type: Date, default: Date.now, index: true }, source: { type: String, default: 'api' },
}, { timestamps: true });
telemetryPointSchema.index({ vehicle: 1, capturedAt: -1 });
export default mongoose.model('TelemetryPoint', telemetryPointSchema);
