import Mechanic from '../models/Mechanic.js';

export const getMechanics = async (req, res) => {
  try {
    const mechanics = await Mechanic.find({ isActive: true }).sort('-rating');
    res.status(200).json({ ok: true, count: mechanics.length, mechanics });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

export const getMechanicById = async (req, res) => {
  try {
    const mechanic = await Mechanic.findById(req.params.id);
    if (!mechanic) return res.status(404).json({ ok: false, error: 'Mechanic not found' });
    res.status(200).json({ ok: true, mechanic });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

export const createMechanic = async (req, res) => {
  try {
    const mechanic = await Mechanic.create(req.body);
    res.status(201).json({ ok: true, mechanic });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

export const updateMechanic = async (req, res) => {
  try {
    const mechanic = await Mechanic.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!mechanic) return res.status(404).json({ ok: false, error: 'Mechanic not found' });
    res.status(200).json({ ok: true, mechanic });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

export const deleteMechanic = async (req, res) => {
  try {
    const mechanic = await Mechanic.findByIdAndDelete(req.params.id);
    if (!mechanic) return res.status(404).json({ ok: false, error: 'Mechanic not found' });
    res.status(200).json({ ok: true, message: 'Mechanic removed' });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};
