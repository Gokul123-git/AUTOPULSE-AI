import mongoose from 'mongoose';

const maintenanceRecordSchema = new mongoose.Schema(
  {
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    serviceCenter: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceCenter' },
    mechanic: { type: mongoose.Schema.Types.ObjectId, ref: 'Mechanic' },
    type: {
      type: String,
      enum: ['routine', 'repair', 'emergency', 'inspection', 'recall', 'body_work', 'ac_service', 'tyre_service', 'battery_service', 'other'],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    odometerReading: { type: Number },
    serviceDate: { type: Date, required: true },
    completionDate: { type: Date },
    cost: {
      labor: { type: Number, default: 0 },
      parts: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      total: { type: Number, required: true },
      currency: { type: String, default: 'INR' },
    },
    partsReplaced: [
      {
        name: String,
        quantity: Number,
        cost: Number,
        warranty: String,
      },
    ],
    documents: [{ type: String }],
    photos: [{ type: String }],
    invoiceNumber: { type: String },
    warrantyClaimed: { type: Boolean, default: false },
    notes: { type: String },
    nextServiceDue: {
      date: Date,
      odometer: Number,
      type: String,
    },
    status: {
      type: String,
      enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
      default: 'completed',
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const MaintenanceRecord = mongoose.model('MaintenanceRecord', maintenanceRecordSchema);
export default MaintenanceRecord;
