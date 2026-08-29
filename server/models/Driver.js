import mongoose from 'mongoose';

const driverSchema = new mongoose.Schema(
  {
    fleetManager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    licenseNumber: { type: String, required: true, trim: true },
    licenseExpiry: { type: Date },
    assignedVehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
    drivingScore: { type: Number, default: 100, min: 0, max: 100 },
    totalTrips: { type: Number, default: 0 },
    totalDistance: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'on_trip', 'off_duty', 'inactive'], default: 'active' },
    joinDate: { type: Date },
    address: { type: String, trim: true },
    emergencyContact: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Driver = mongoose.model('Driver', driverSchema);
export default Driver;
