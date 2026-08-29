import mongoose from 'mongoose';
const geofenceSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  name: { type: String, required: true }, latitude: { type: Number, required: true }, longitude: { type: Number, required: true }, radiusMeters: { type: Number, required: true, min: 10 }, active: { type: Boolean, default: true },
}, { timestamps: true });
export default mongoose.model('Geofence', geofenceSchema);
