import mongoose from 'mongoose';

const fuelLogSchema = new mongoose.Schema(
  {
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    odometer: { type: Number, required: true },
    quantity: { type: Number, required: true },
    costPerUnit: { type: Number, required: true },
    totalCost: { type: Number, required: true },
    fuelType: {
      type: String,
      enum: ['petrol', 'diesel', 'cng', 'electric', 'lpg'],
      required: true,
    },
    station: { type: String, trim: true },
    location: { type: String, trim: true },
    isFullTank: { type: Boolean, default: true },
    notes: { type: String, trim: true },
    mileage: { type: Number },
    drivingMode: { type: String, enum: ['city', 'highway', 'mixed'], default: 'mixed' },
    billImage: { type: String },
  },
  { timestamps: true }
);

fuelLogSchema.index({ vehicle: 1, date: -1 });

const FuelLog = mongoose.model('FuelLog', fuelLogSchema);
export default FuelLog;
