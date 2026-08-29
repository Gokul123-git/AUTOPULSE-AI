import Inventory from '../models/Inventory.js';

export const getInventory = async (req, res) => {
  try {
    const items = await Inventory.find({}).sort('-updatedAt');
    res.status(200).json({ ok: true, count: items.length, items });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

export const getInventoryById = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ ok: false, error: 'Inventory item not found' });
    res.status(200).json({ ok: true, item });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

export const createInventoryItem = async (req, res) => {
  try {
    const item = await Inventory.create(req.body);
    res.status(201).json({ ok: true, item });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

export const updateInventoryItem = async (req, res) => {
  try {
    const item = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ ok: false, error: 'Inventory item not found' });
    res.status(200).json({ ok: true, item });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

export const deleteInventoryItem = async (req, res) => {
  try {
    const item = await Inventory.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ ok: false, error: 'Inventory item not found' });
    res.status(200).json({ ok: true, message: 'Inventory item deleted' });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};
