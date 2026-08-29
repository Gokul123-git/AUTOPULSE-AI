import mongoose from 'mongoose';

const serviceCenterSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, lowercase: true, trim: true },
    website: { type: String, trim: true },
    gstin: { type: String, trim: true },
    operatingHours: {
      monday: { open: String, close: String },
      tuesday: { open: String, close: String },
      wednesday: { open: String, close: String },
      thursday: { open: String, close: String },
      friday: { open: String, close: String },
      saturday: { open: String, close: String },
      sunday: { open: String, close: String },
    },
    services: [{ type: String }],
    specializations: [{ type: String }],
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    totalAppointments: { type: Number, default: 0 },
    images: [{ type: String }],
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

serviceCenterSchema.index({ location: '2dsphere' });

const ServiceCenter = mongoose.model('ServiceCenter', serviceCenterSchema);
export default ServiceCenter;
