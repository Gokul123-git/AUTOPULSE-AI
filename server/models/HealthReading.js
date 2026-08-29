import mongoose from 'mongoose';

const healthReadingSchema = new mongoose.Schema({
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  currentOdometer: { type: Number, required: true, min: 0 },
  engineTemperature: { type: Number, required: true, min: -50, max: 200 },
  engineOilLevel: { type: String, required: true, enum: ['normal', 'low'] },
  engineRpm: { type: Number, required: true, min: 0 },
  batteryVoltage: { type: Number, required: true, min: 0 },
  batteryHealth: { type: Number, required: true, min: 0, max: 100 },
  tyrePressure: { fl: { type: Number, required: true, min: 0 }, fr: { type: Number, required: true, min: 0 }, rl: { type: Number, required: true, min: 0 }, rr: { type: Number, required: true, min: 0 } },
  tyreWear: { type: Number, required: true, min: 0, max: 100 },
  brakeCondition: { type: Number, required: true, min: 0, max: 100 },
  coolantLevel: { type: String, required: true, enum: ['normal', 'low'] },
  fuelLevel: { type: Number, required: true, min: 0, max: 100 },
  averageFuelEfficiency: { type: Number, required: true, min: 0 },
  lastServiceDate: { type: Date, required: true },
  checkEngineLight: { type: Boolean, default: false },
  vibrationLevel: { type: Number, min: 0, max: 100, default: 0 },
  smokeLevel: { type: String, enum: ['none', 'low', 'medium', 'high'], default: 'none' },
  noiseLevel: { type: String, enum: ['normal', 'medium', 'high'], default: 'normal' },
  analysis: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

healthReadingSchema.index({ vehicle: 1, createdAt: -1 });
export default mongoose.model('HealthReading', healthReadingSchema);
