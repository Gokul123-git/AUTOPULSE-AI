import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    serviceCenter: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceCenter', required: true },
    mechanic: { type: mongoose.Schema.Types.ObjectId, ref: 'Mechanic' },
    serviceType: {
      type: String,
      enum: ['routine', 'repair', 'emergency', 'inspection', 'recall', 'body_work', 'ac_service', 'tyre_service', 'battery_service', 'other'],
      required: true,
    },
    description: { type: String, trim: true },
    contactNumber: { type: String, trim: true },
    scheduledDate: { type: Date, required: true },
    scheduledTime: { type: String, required: true },
    estimatedDuration: { type: Number }, // in minutes
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rejected', 'rescheduled'],
      default: 'pending',
    },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    cost: {
      estimated: { type: Number },
      final: { type: Number },
      currency: { type: String, default: 'INR' },
    },
    payment: {
      status: { type: String, enum: ['pending', 'paid', 'partial', 'refunded'], default: 'pending' },
      method: { type: String, enum: ['cash', 'card', 'upi', 'net_banking', 'insurance'] },
      transactionId: String,
      paidAt: Date,
    },
    notes: { type: String },
    pickupDropOption: { type: String, enum: ['none', 'pickup', 'drop', 'pickup_and_drop'], default: 'none' },
    bookingId: { type: String, unique: true, sparse: true, trim: true },
    cancellationReason: { type: String },
    rating: { type: Number, min: 1, max: 5 },
    feedback: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

appointmentSchema.pre('validate', function (next) {
  if (!this.bookingId) this.bookingId = `AP-${Date.now().toString(36).toUpperCase()}-${this._id.toString().slice(-6).toUpperCase()}`;
  next();
});

const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;
