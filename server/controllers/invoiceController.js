import Invoice from '../models/Invoice.js';

export const getInvoices = async (req, res) => {
  try {
    const filter = {};
    if (req.user?.role === 'vehicle_owner') filter.owner = req.user._id;
    const invoices = await Invoice.find(filter).sort('-createdAt');
    res.status(200).json({ ok: true, count: invoices.length, invoices });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ ok: false, error: 'Invoice not found' });
    res.status(200).json({ ok: true, invoice });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

export const createInvoice = async (req, res) => {
  try {
    const data = { ...req.body, owner: req.user._id };
    const invoice = await Invoice.create(data);
    res.status(201).json({ ok: true, invoice });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

export const updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!invoice) return res.status(404).json({ ok: false, error: 'Invoice not found' });
    res.status(200).json({ ok: true, invoice });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

export const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) return res.status(404).json({ ok: false, error: 'Invoice not found' });
    res.status(200).json({ ok: true, message: 'Invoice deleted' });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};
