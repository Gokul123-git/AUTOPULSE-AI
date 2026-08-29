import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: {
      type: String,
      enum: ['fuel', 'service', 'repair', 'insurance', 'accessories', 'road_tax', 'tyres', 'battery', 'cleaning', 'modification', 'other'],
      required: true,
    },
    subCategory: { type: String, trim: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    date: { type: Date, required: true },
    description: { type: String, trim: true },
    paymentMethod: { type: String, enum: ['cash', 'card', 'upi', 'net_banking', 'insurance', 'other'] },
    billImage: { type: String },
    vendor: { type: String, trim: true },
    isRecurring: { type: Boolean, default: false },
    recurringFrequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] },
    tags: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

expenseSchema.index({ vehicle: 1, date: -1 });
expenseSchema.index({ owner: 1, category: 1 });

const Expense = mongoose.model('Expense', expenseSchema);
export default Expense;
