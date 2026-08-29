import Appointment from '../models/Appointment.js';
import Vehicle from '../models/Vehicle.js';

export const getAppointments = async (req, res) => {
  try {
    const filter = {};
    if (req.user?.role !== 'admin') filter.owner = req.user._id;
    if (req.query.vehicle) filter.vehicle = req.query.vehicle;
    const items = await Appointment.find(filter)
      .populate('vehicle', 'vehicleName manufacturer model registrationNumber images fuelType currentOdometer')
      .populate('serviceCenter', 'name location address phone images rating')
      .populate('mechanic', 'name')
      .sort({ createdAt: -1 });
    res.status(200).json({ ok: true, count: items.length, appointments: items });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

export const getAppointmentById = async (req, res) => {
  try {
    const item = await Appointment.findById(req.params.id)
      .populate('vehicle serviceCenter mechanic');
    if (!item) return res.status(404).json({ ok: false, error: 'Appointment not found' });
    if (req.user.role !== 'admin' && item.owner.toString() !== req.user._id.toString()) return res.status(403).json({ ok: false, error: 'Not authorized to view this booking' });
    res.status(200).json({ ok: true, appointment: item });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

export const createAppointment = async (req, res) => {
  try {
    if (!req.body.vehicle || !req.body.serviceCenter || !req.body.serviceType || !req.body.scheduledDate || !req.body.scheduledTime) {
      return res.status(400).json({ ok: false, error: 'Vehicle, service center, service type, preferred date, and time are required.' });
    }
    const vehicle = await Vehicle.findById(req.body.vehicle);
    if (!vehicle) return res.status(404).json({ ok: false, error: 'Selected vehicle was not found.' });
    if (req.user.role !== 'admin' && vehicle.owner.toString() !== req.user._id.toString()) return res.status(403).json({ ok: false, error: 'You can only book service for your own vehicle.' });
    
    const data = { ...req.body, owner: req.user._id };
    const appointment = await Appointment.create(data);
    const populated = await Appointment.findById(appointment._id)
      .populate('vehicle', 'vehicleName manufacturer model registrationNumber images')
      .populate('serviceCenter', 'name location address phone images rating');

    res.status(201).json({ ok: true, appointment: populated || appointment });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

export const updateAppointment = async (req, res) => {
  try {
    const existing = await Appointment.findById(req.params.id);
    if (!existing) return res.status(404).json({ ok: false, error: 'Appointment not found' });
    if (req.user.role !== 'admin' && existing.owner.toString() !== req.user._id.toString()) return res.status(403).json({ ok: false, error: 'Not authorized to update this booking' });
    if (['completed', 'cancelled'].includes(existing.status) && req.user.role !== 'admin') return res.status(400).json({ ok: false, error: 'Completed or cancelled bookings cannot be changed.' });
    const allowed = req.user.role === 'admin'
      ? ['scheduledDate', 'scheduledTime', 'serviceType', 'description', 'contactNumber', 'notes', 'pickupDropOption', 'status', 'cancellationReason', 'mechanic', 'cost']
      : ['scheduledDate', 'scheduledTime', 'serviceType', 'description', 'contactNumber', 'notes', 'pickupDropOption', 'cancellationReason'];
    const update = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    const appointment = await Appointment.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true })
      .populate('vehicle serviceCenter mechanic');
    res.status(200).json({ ok: true, appointment });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

export const deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ ok: false, error: 'Appointment not found' });
    if (req.user.role !== 'admin' && appointment.owner.toString() !== req.user._id.toString()) return res.status(403).json({ ok: false, error: 'Not authorized to cancel this booking' });
    
    // Perform actual deletion or set cancelled status
    await Appointment.findByIdAndDelete(req.params.id);
    res.status(200).json({ ok: true, message: 'Booking removed successfully' });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};
