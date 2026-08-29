import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vin: { type: String, unique: true, sparse: true, uppercase: true, trim: true },
    registrationNumber: { type: String, required: true, uppercase: true, trim: true },
    vehicleName: { type: String, trim: true },
    vehicleType: { type: String, trim: true },
    engineNumber: { type: String, trim: true },
    engineCapacity: { type: Number, min: 0 },
    manufacturer: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    variant: { type: String, trim: true },
    fuelType: {
      type: String,
      enum: ['petrol', 'diesel', 'cng', 'electric', 'hybrid', 'lpg'],
      required: true,
    },
    transmission: { type: String, enum: ['manual', 'automatic', 'cvt', 'dct'], required: true },
    manufacturingYear: { type: Number, required: true },
    purchaseDate: { type: Date },
    currentOdometer: { type: Number, default: 0 },
    engineTemperature: { type: Number, min: -50, max: 200 },
    fuelLevel: { type: Number, min: 0, max: 100 },
    color: { type: String, trim: true },
    images: [{ type: String }],
    insurance: {
      provider: String,
      policyNumber: String,
      expiryDate: Date,
      coverage: String,
      document: String,
    },
    pollutionCertificate: {
      certificateNumber: String,
      issueDate: Date,
      expiryDate: Date,
      document: String,
    },
    registrationExpiry: { type: Date },
    lastServiceDate: { type: Date },
    nextServiceDue: { type: Date },
    warranty: {
      type: { type: String, enum: ['standard', 'extended', 'none'], default: 'standard' },
      expiryDate: Date,
      expiryKm: Number,
      provider: String,
    },
    healthScore: { type: Number, default: null, min: 0, max: 100 },
    engineHealth: { type: Number, default: null }, batteryHealth: { type: Number, default: null }, brakeHealth: { type: Number, default: null }, tyreHealth: { type: Number, default: null }, transmissionHealth: { type: Number, default: null }, coolingSystemHealth: { type: Number, default: null }, oilHealth: { type: Number, default: null },
    status: { type: String, enum: ['active', 'in_service', 'sold', 'idle'], default: 'active' },
    qrCode: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

vehicleSchema.index({ owner: 1 });
// A registration belongs to one owner. This avoids blocking a new owner from
// registering a vehicle after a legitimate ownership change, while preventing
// duplicate registrations inside a user's own garage.
vehicleSchema.index({ owner: 1, registrationNumber: 1 }, { unique: true });

const Vehicle = mongoose.model('Vehicle', vehicleSchema);
export default Vehicle;
