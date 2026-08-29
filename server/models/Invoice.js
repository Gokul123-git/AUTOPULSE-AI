import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema(
  {
    serviceCenter: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceCenter', required: true },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    maintenanceRecord: { type: mongoose.Schema.Types.ObjectId, ref: 'MaintenanceRecord' },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    invoiceNumber: { type: String, required: true, unique: true },
    date: { type: Date, required: true },
    dueDate: { type: Date },
    items: [
      {
        description: String,
        quantity: { type: Number, default: 1 },
        unitPrice: Number,
        amount: Number,
        category: { type: String, enum: ['labor', 'part', 'consumable', 'tax', 'other'] },
      },
    ],
    subtotal: { type: Number, required: true },
    taxRate: { type: Number, default: 18 },
    taxAmount: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled'], default: 'draft' },
    paymentMethod: { type: String, enum: ['cash', 'card', 'upi', 'net_banking', 'insurance'] },
    paymentDate: { type: Date },
    transactionId: { type: String },
    notes: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;
