import Vehicle from '../models/Vehicle.js';
import HealthReading from '../models/HealthReading.js';
import VehicleAssessment from '../models/VehicleAssessment.js';
import Prediction from '../models/Prediction.js';
import MaintenanceRecord from '../models/MaintenanceRecord.js';
import Appointment from '../models/Appointment.js';
import TelemetryPoint from '../models/TelemetryPoint.js';
import FuelLog from '../models/FuelLog.js';
import Expense from '../models/Expense.js';

const vehicleInput = (body = {}) => ({
  ...body,
  vehicleName: body.vehicleName || body.name,
  manufacturer: body.manufacturer || body.brand,
  registrationNumber: body.registrationNumber || body.vehicleNumber,
  vin: body.vin || body.chassisNumber || body.vinChassisNumber,
});

const normaliseRegistrationNumber = (value) => String(value || '').replace(/\s+/g, '').toUpperCase();

const validateVehicleInput = (data) => {
  const required = ['vehicleName', 'manufacturer', 'model', 'registrationNumber', 'vehicleType', 'manufacturingYear', 'fuelType', 'transmission', 'currentOdometer'];
  const missing = required.filter((field) => data[field] === undefined || data[field] === null || String(data[field]).trim() === '');
  if (missing.length) return `Please provide: ${missing.join(', ')}.`;
  const year = Number(data.manufacturingYear);
  if (!Number.isInteger(year) || year < 1886 || year > new Date().getFullYear() + 1) return 'Please enter a valid manufacturing year.';
  if (data.currentOdometer !== undefined && (!Number.isFinite(Number(data.currentOdometer)) || Number(data.currentOdometer) < 0)) return 'Current odometer must be a positive number.';
  return null;
};

const uploadedImages = (files) => {
  if (Array.isArray(files)) return files;
  return Object.values(files || {}).flat();
};

// GET /api/vehicles
export const getVehicles = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role !== 'admin') {
      filter.owner = req.user._id;
    }
    const vehicles = await Vehicle.find(filter)
      .populate('owner', 'name email phone role')
      .sort('-createdAt');
    res.status(200).json({ ok: true, count: vehicles.length, vehicles });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// GET /api/vehicles/:id
export const getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate('owner', 'name email phone role');
    if (!vehicle) {
      return res.status(404).json({ ok: false, error: 'Vehicle not found' });
    }
    if (req.user.role !== 'admin' && vehicle.owner._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ ok: false, error: 'Not authorized' });
    }
    res.status(200).json({ ok: true, vehicle });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// POST /api/vehicles
export const createVehicle = async (req, res) => {
  try {
    const vehicleData = {
      ...vehicleInput(req.body),
      owner: req.user.role === 'admin' ? (req.body.owner || req.user._id) : req.user._id,
    };
    vehicleData.registrationNumber = normaliseRegistrationNumber(vehicleData.registrationNumber);
    const validationError = validateVehicleInput(vehicleData);
    if (validationError) return res.status(400).json({ ok: false, error: validationError });

    vehicleData.fuelType = String(vehicleData.fuelType).toLowerCase();
    vehicleData.transmission = String(vehicleData.transmission).toLowerCase();
    Object.assign(vehicleData, { healthScore: undefined, engineHealth: undefined, batteryHealth: undefined, brakeHealth: undefined, tyreHealth: undefined, transmissionHealth: undefined, coolingSystemHealth: undefined, oilHealth: undefined });

    const files = uploadedImages(req.files);
    if (files.length > 0) {
      vehicleData.images = files.map((f) => `/uploads/${f.filename}`);
    }

    const vehicle = await Vehicle.create(vehicleData);
    res.status(201).json({ ok: true, message: 'Vehicle registered successfully.', vehicle });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ ok: false, error: 'This vehicle number is already registered in your account.' });
    }
    res.status(400).json({ ok: false, error: error.message || 'Unable to save vehicle details.' });
  }
};

// PUT /api/vehicles/:id
export const updateVehicle = async (req, res) => {
  try {
    let vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ ok: false, error: 'Vehicle not found' });
    }
    if (req.user.role !== 'admin' && vehicle.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ ok: false, error: 'Not authorized' });
    }

    const updateData = vehicleInput(req.body);
    const files = uploadedImages(req.files);
    if (files.length > 0) {
      const newImages = files.map((f) => `/uploads/${f.filename}`);
      updateData.images = [...(vehicle.images || []), ...newImages];
    }

    vehicle = await Vehicle.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true }).populate('owner', 'name email phone');
    res.status(200).json({ ok: true, vehicle });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// DELETE /api/vehicles/:id (Cascading Delete of associated records)
export const deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ ok: false, error: 'Vehicle not found' });
    }
    if (req.user.role !== 'admin' && vehicle.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ ok: false, error: 'Only the vehicle owner or an administrator can delete this vehicle.' });
    }

    const vehicleId = req.params.id;

    // Perform cascading deletion across associated MongoDB collections
    await Promise.all([
      HealthReading.deleteMany({ vehicle: vehicleId }),
      VehicleAssessment.deleteMany({ vehicle: vehicleId }),
      Prediction.deleteMany({ vehicle: vehicleId }),
      MaintenanceRecord.deleteMany({ vehicle: vehicleId }),
      Appointment.deleteMany({ vehicle: vehicleId }),
      TelemetryPoint.deleteMany({ vehicleId: vehicleId }),
      FuelLog.deleteMany({ vehicle: vehicleId }),
      Expense.deleteMany({ vehicle: vehicleId }),
      Vehicle.findByIdAndDelete(vehicleId),
    ]);

    res.status(200).json({
      ok: true,
      message: 'Vehicle and all associated inspection records, AI predictions, maintenance history, and service bookings were permanently deleted.',
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// GET /api/vehicles/:id/health
export const getVehicleHealth = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ ok: false, error: 'Vehicle not found' });
    }
    if (req.user.role !== 'admin' && vehicle.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ ok: false, error: 'Not authorized' });
    }

    res.status(200).json({
      ok: true,
      health: {
        healthScore: vehicle.healthScore,
        engineHealth: vehicle.engineHealth,
        batteryHealth: vehicle.batteryHealth,
        brakeHealth: vehicle.brakeHealth,
        tyreHealth: vehicle.tyreHealth,
        transmissionHealth: vehicle.transmissionHealth,
        coolingSystemHealth: vehicle.coolingSystemHealth,
        oilHealth: vehicle.oilHealth,
        insuranceExpiry: vehicle.insurance?.expiryDate,
        pollutionExpiry: vehicle.pollutionCertificate?.expiryDate,
        warrantyExpiry: vehicle.warranty?.expiryDate,
        odometer: vehicle.currentOdometer,
        status: vehicle.status,
      },
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};
