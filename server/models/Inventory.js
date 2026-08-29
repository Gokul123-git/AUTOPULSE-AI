import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema(
  {
    serviceCenter: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceCenter', required: true },
    name: { type: String, required: true, trim: true },
    partNumber: { type: String, trim: true },
    category: { type: String, enum: ['engine', 'brakes', 'suspension', 'electrical', 'body', 'tyres', 'battery', 'filters', 'fluids', 'other'], required: true },
    manufacturer: { type: String, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, default: 'piece' },
    costPrice: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    compatibleVehicles: [{ type: String }],
    reorderLevel: { type: Number, default: 10 },
    location: { type: String, trim: true },
    supplier: { type: String, trim: true },
    lastOrdered: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Inventory = mongoose.model('Inventory', inventorySchema);
export default Inventory;
