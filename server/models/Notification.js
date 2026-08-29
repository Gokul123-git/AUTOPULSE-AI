import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: [
        'service_reminder', 'engine_alert', 'battery_alert', 'brake_alert',
        'tyre_alert', 'insurance_expiry', 'pollution_expiry', 'warranty_expiry',
        'appointment_reminder', 'appointment_confirmed', 'appointment_cancelled',
        'payment_due', 'maintenance_due', 'fuel_alert', 'system', 'promotion',
      ],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    channel: {
      type: String,
      enum: ['email', 'sms', 'push', 'in_app'],
      default: 'in_app',
    },
    relatedEntity: {
      entityType: { type: String, enum: ['vehicle', 'appointment', 'maintenance', 'expense', 'prediction'] },
      entityId: { type: mongoose.Schema.Types.ObjectId },
    },
    actionUrl: { type: String },
    sentAt: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
