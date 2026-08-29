import mongoose from 'mongoose';

const mechanicSchema = new mongoose.Schema(
  {
    serviceCenter: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceCenter', required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    specializations: [{ type: String }],
    experience: { type: Number, default: 0 }, // years
    certifications: [{ type: String }],
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalJobs: { type: Number, default: 0 },
    status: { type: String, enum: ['available', 'busy', 'on_leave', 'inactive'], default: 'available' },
    workingHours: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '18:00' },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Mechanic = mongoose.model('Mechanic', mechanicSchema);
export default Mechanic;
