import Driver from '../models/Driver.js';

export const getDrivers = async (req, res) => {
  try {
    const filter = {};
    if (req.user?.role === 'fleet_manager') filter.fleetManager = req.user._id;
    const drivers = await Driver.find(filter).sort('-createdAt');
    res.status(200).json({ ok: true, count: drivers.length, drivers });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

export const getDriverById = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id).populate('assignedVehicle', 'manufacturer model registrationNumber');
    if (!driver) return res.status(404).json({ ok: false, error: 'Driver not found' });
    res.status(200).json({ ok: true, driver });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

export const createDriver = async (req, res) => {
  try {
    const data = { ...req.body, fleetManager: req.user._id };
    const driver = await Driver.create(data);
    res.status(201).json({ ok: true, driver });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

export const updateDriver = async (req, res) => {
  try {
    const driver = await Driver.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!driver) return res.status(404).json({ ok: false, error: 'Driver not found' });
    res.status(200).json({ ok: true, driver });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

export const deleteDriver = async (req, res) => {
  try {
    const driver = await Driver.findByIdAndDelete(req.params.id);
    if (!driver) return res.status(404).json({ ok: false, error: 'Driver not found' });
    res.status(200).json({ ok: true, message: 'Driver removed' });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};
