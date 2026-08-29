import Vehicle from '../models/Vehicle.js';
import HealthReading from '../models/HealthReading.js';
import Prediction from '../models/Prediction.js';
import MaintenanceRecord from '../models/MaintenanceRecord.js';
import Appointment from '../models/Appointment.js';
import Notification from '../models/Notification.js';

// A single authenticated bootstrap response lets a returning user restore the
// complete dashboard without trusting data cached in the browser.
export const restoreUserData = async (req, res) => {
  try {
    const owner = req.user._id;
    const [vehicles, healthReadings, predictions, maintenanceRecords, appointments, notifications] = await Promise.all([
      Vehicle.find({ owner }).sort('-createdAt'),
      HealthReading.find({ owner }).sort('-createdAt').limit(100),
      Prediction.find({ owner }).sort('-createdAt').limit(100),
      MaintenanceRecord.find({ owner }).sort('-serviceDate').populate('vehicle', 'manufacturer model registrationNumber'),
      Appointment.find({ owner }).sort('-scheduledDate').populate('vehicle', 'manufacturer model registrationNumber'),
      Notification.find({ recipient: owner }).sort('-createdAt').limit(50),
    ]);
    res.json({ ok: true, onboarding: vehicles.length === 0, data: { vehicles, healthReadings, predictions, maintenanceRecords, appointments, notifications } });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'Unable to restore your saved data.' });
  }
};
