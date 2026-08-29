import MaintenanceRecord from '../models/MaintenanceRecord.js';
import Appointment from '../models/Appointment.js';
import Vehicle from '../models/Vehicle.js';

// GET /api/maintenance
export const getMaintenanceRecords = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role !== 'admin') filter.owner = req.user._id;
    if (req.query.vehicle) filter.vehicle = req.query.vehicle;
    if (req.query.type) filter.type = req.query.type;

    const records = await MaintenanceRecord.find(filter)
      .populate('vehicle', 'manufacturer model registrationNumber')
      .populate('serviceCenter', 'name')
      .sort('-serviceDate');

    res.status(200).json({ ok: true, count: records.length, records });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// GET /api/maintenance/:id
export const getMaintenanceById = async (req, res) => {
  try {
    const record = await MaintenanceRecord.findById(req.params.id)
      .populate('vehicle')
      .populate('serviceCenter')
      .populate('mechanic');
    if (!record) {
      return res.status(404).json({ ok: false, error: 'Maintenance record not found' });
    }
    if (req.user.role !== 'admin' && record.owner.toString() !== req.user._id.toString()) return res.status(403).json({ ok: false, error: 'Not authorized' });
    res.status(200).json({ ok: true, record });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// POST /api/maintenance
export const createMaintenanceRecord = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.body.vehicle);
    if (!vehicle) return res.status(404).json({ ok: false, error: 'Vehicle not found' });
    if (req.user.role !== 'admin' && vehicle.owner.toString() !== req.user._id.toString()) return res.status(403).json({ ok: false, error: 'You can only save maintenance for your own vehicle.' });

    const recordData = {
      ...req.body,
      owner: req.user._id,
    };

    if (req.files) {
      if (req.files.photos) recordData.photos = req.files.photos.map((f) => `/uploads/${f.filename}`);
      if (req.files.documents) recordData.documents = req.files.documents.map((f) => `/uploads/${f.filename}`);
    }

    const record = await MaintenanceRecord.create(recordData);

    // Update vehicle health if maintenance is related
    if (req.body.type === 'tyre_service') vehicle.tyreHealth = Math.min(100, vehicle.tyreHealth + 15);
    if (req.body.type === 'battery_service') vehicle.batteryHealth = Math.min(100, vehicle.batteryHealth + 15);
    if (req.body.type === 'routine') {
      vehicle.engineHealth = Math.min(100, vehicle.engineHealth + 10);
      vehicle.oilHealth = 100;
      vehicle.healthScore = calculateHealthScore(vehicle);
    }
    await vehicle.save();

    res.status(201).json({ ok: true, record });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// PUT /api/maintenance/:id
export const updateMaintenanceRecord = async (req, res) => {
  try {
    let record = await MaintenanceRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ ok: false, error: 'Maintenance record not found' });
    if (req.user.role !== 'admin' && record.owner.toString() !== req.user._id.toString()) return res.status(403).json({ ok: false, error: 'Not authorized' });

    record = await MaintenanceRecord.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ ok: true, record });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// DELETE /api/maintenance/:id
export const deleteMaintenanceRecord = async (req, res) => {
  try {
    const record = await MaintenanceRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ ok: false, error: 'Maintenance record not found' });
    if (req.user.role !== 'admin' && record.owner.toString() !== req.user._id.toString()) return res.status(403).json({ ok: false, error: 'Not authorized' });

    await MaintenanceRecord.findByIdAndDelete(req.params.id);
    res.status(200).json({ ok: true, message: 'Maintenance record deleted' });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// GET /api/maintenance/recommendations
export const getRecommendations = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ owner: req.user._id, isActive: true });
    const recommendations = [];

    for (const vehicle of vehicles) {
      if (vehicle.engineHealth < 70) {
        recommendations.push({
          vehicle: vehicle._id,
          vehicleName: `${vehicle.manufacturer} ${vehicle.model}`,
          type: 'engine_inspection',
          priority: 'high',
          message: `Engine health is at ${vehicle.engineHealth}%. Schedule an inspection.`,
          estimatedCost: 1500,
        });
      }
      if (vehicle.brakeHealth < 60) {
        recommendations.push({
          vehicle: vehicle._id,
          vehicleName: `${vehicle.manufacturer} ${vehicle.model}`,
          type: 'brake_service',
          priority: 'high',
          message: `Brake health is at ${vehicle.brakeHealth}%. Immediate service recommended.`,
          estimatedCost: 800,
        });
      }
      if (vehicle.tyreHealth < 65) {
        recommendations.push({
          vehicle: vehicle._id,
          vehicleName: `${vehicle.manufacturer} ${vehicle.model}`,
          type: 'tyre_replacement',
          priority: 'medium',
          message: `Tyre health at ${vehicle.tyreHealth}%. Consider rotation or replacement.`,
          estimatedCost: 1200,
        });
      }
      if (vehicle.oilHealth < 40) {
        recommendations.push({
          vehicle: vehicle._id,
          vehicleName: `${vehicle.manufacturer} ${vehicle.model}`,
          type: 'oil_change',
          priority: 'high',
          message: `Oil health critical at ${vehicle.oilHealth}%. Schedule oil change immediately.`,
          estimatedCost: 200,
        });
      }
    }

    res.status(200).json({ ok: true, count: recommendations.length, recommendations });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

function calculateHealthScore(vehicle) {
  return Math.round(
    (vehicle.engineHealth + vehicle.batteryHealth + vehicle.brakeHealth +
     vehicle.tyreHealth + vehicle.transmissionHealth + vehicle.coolingSystemHealth +
     vehicle.oilHealth) / 7
  );
}
