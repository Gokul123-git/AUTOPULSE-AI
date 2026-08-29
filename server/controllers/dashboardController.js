import Vehicle from '../models/Vehicle.js';
import Prediction from '../models/Prediction.js';
import MaintenanceRecord from '../models/MaintenanceRecord.js';
import FuelLog from '../models/FuelLog.js';
import Expense from '../models/Expense.js';
import Notification from '../models/Notification.js';
import Appointment from '../models/Appointment.js';

// GET /api/dashboard
export const getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    const vehicles = await Vehicle.find({ owner: userId, isActive: true }).sort('-createdAt');
    if (vehicles.length === 0) {
      // First-time user experience
      return res.status(200).json({
        ok: true,
        hasVehicles: false,
        message:
          'Welcome to AutoPulse AI! Register your first vehicle to start AI-powered health monitoring.',
        welcome: {
          ctaText: 'Register Your Vehicle',
          steps: [
            'Register your vehicle.',
            'Complete the vehicle details.',
            'View AI insights and maintenance predictions.',
          ],
          features: [
            'AI Vehicle Health Score',
            'Predictive Maintenance',
            'Fuel Analytics',
            'Maintenance Reminders',
            'Service History',
            'Performance Reports',
          ],
          kpis: [
            { key: 'healthScore', label: 'AI Vehicle Health', value: 'Waiting for Vehicle Data' },
            { key: 'maintenance', label: 'Predictive Maintenance', value: 'Waiting for Vehicle Data' },
            { key: 'fleet', label: 'Fleet Analytics', value: 'Waiting for Vehicle Data' },
          ],
          // UI can render an illustration/animation based on this key
          illustration: 'vehicle-illustration',
        },
      });
    }

    const selectedVehicle = vehicles.find((v) => v._id.toString() === (req.query.vehicleId || '').toString()) || vehicles[0];
    const vehicleIds = [selectedVehicle._id];
    const primaryVehicle = selectedVehicle;


    const [predictions, recentMaintenance, fuelLogs, expenses, notifications, upcomingAppointments] =
      await Promise.all([
        Prediction.find({ vehicle: { $in: vehicleIds }, status: 'active' })
          .sort('-createdAt')
          .limit(10),
        MaintenanceRecord.find({ vehicle: { $in: vehicleIds } })
          .sort('-serviceDate')
          .limit(5)
          .populate('serviceCenter', 'name'),
        FuelLog.find({ vehicle: { $in: vehicleIds } })
          .sort('-date')
          .limit(12),
        Expense.find({ vehicle: { $in: vehicleIds } })
          .sort('-date')
          .limit(12),
        Notification.find({ recipient: userId, isRead: false })
          .sort('-createdAt')
          .limit(10),
        Appointment.find({ vehicle: { $in: vehicleIds }, status: { $in: ['pending', 'confirmed'] } })
          .sort('scheduledDate')
          .limit(5)
          .populate('serviceCenter', 'name'),
      ]);

    const healthScores = [primaryVehicle].map((v) => (typeof v.healthScore === 'number' ? v.healthScore : 0));
    const avgHealthScore = healthScores.length
      ? Math.round(healthScores.reduce((sum, score) => sum + score, 0) / healthScores.length)
      : 0;


    // Driving score (calculated from fuel efficiency trends)
    const drivingScore = calculateDrivingScore(fuelLogs);

    // Monthly expenses
    const monthlyExpenses = aggregateMonthlyExpenses(expenses);

    // Fuel trend
    const fuelTrend = fuelLogs.map((f) => ({
      date: f.date || null,
      mileage: typeof f.mileage === 'number' ? f.mileage : 0,
      quantity: typeof f.quantity === 'number' ? f.quantity : 0,
      cost: typeof f.totalCost === 'number' ? f.totalCost : 0,
    }));

    // Service due countdown
    const nextService = await MaintenanceRecord.findOne({
      vehicle: { $in: vehicleIds },
      'nextServiceDue.date': { $exists: true, $gt: new Date() },
    }).sort('nextServiceDue.date');

    const serviceDueCountdown = nextService?.nextServiceDue?.date
      ? Math.ceil((new Date(nextService.nextServiceDue.date) - new Date()) / (1000 * 60 * 60 * 24))
      : null;

    // Prediction summary
    const predictionSummary = {};
    predictions.forEach((p) => {
      predictionSummary[p.category || 'unknown'] = typeof p.riskPercentage === 'number' ? p.riskPercentage : 0;
    });

    // Recent alerts from predictions with high risk
    const recentAlerts = predictions
      .filter((p) => typeof p.riskPercentage === 'number' && p.riskPercentage > 50)
      .map((p) => ({
        type: p.category || 'unknown',
        risk: p.riskPercentage || 0,
        severity: p.severity || 'medium',
        reason: p.reason || 'Check vehicle diagnostics for possible issues',
        action: p.recommendedAction || 'Review the prediction details and schedule service if needed',
      }));

    const dashboard = {
      vehicleSummary: {
        totalVehicles: vehicles.length,
        selectedVehicleId: primaryVehicle?._id || null,

        primaryVehicle: {
          id: primaryVehicle._id,
          name: primaryVehicle.vehicleName || `${primaryVehicle.manufacturer || 'Unknown'} ${primaryVehicle.model || ''}`.trim(),
          registrationNumber: primaryVehicle.registrationNumber || null,
          image: primaryVehicle.images?.[0] || null,
          odometer: typeof primaryVehicle.currentOdometer === 'number' ? primaryVehicle.currentOdometer : 0,
          fuelType: primaryVehicle.fuelType || 'unknown',
        },
      },
      healthScore: avgHealthScore,
      engineHealth: typeof primaryVehicle.engineHealth === 'number' ? primaryVehicle.engineHealth : 0,
      batteryHealth: typeof primaryVehicle.batteryHealth === 'number' ? primaryVehicle.batteryHealth : 0,
      brakeHealth: typeof primaryVehicle.brakeHealth === 'number' ? primaryVehicle.brakeHealth : 0,
      tyreHealth: typeof primaryVehicle.tyreHealth === 'number' ? primaryVehicle.tyreHealth : 0,
      transmissionHealth: typeof primaryVehicle.transmissionHealth === 'number' ? primaryVehicle.transmissionHealth : 0,
      coolingSystemHealth: typeof primaryVehicle.coolingSystemHealth === 'number' ? primaryVehicle.coolingSystemHealth : 0,
      oilHealth: typeof primaryVehicle.oilHealth === 'number' ? primaryVehicle.oilHealth : 0,
      fuelEfficiency: fuelLogs.length > 0 && typeof fuelLogs[0].mileage === 'number' ? fuelLogs[0].mileage : 0,
      serviceDueCountdown,

      insuranceExpiry: primaryVehicle.insurance?.expiryDate || null,
      pollutionCertificateExpiry: primaryVehicle.pollutionCertificate?.expiryDate || null,
      warrantyRemaining: primaryVehicle.warranty?.expiryDate
        ? Math.max(
            0,
            Math.ceil((new Date(primaryVehicle.warranty.expiryDate) - new Date()) / (1000 * 60 * 60 * 24 * 30))
          )
        : null,
      riskPrediction: avgHealthScore > 80 ? 'Low' : avgHealthScore > 60 ? 'Medium' : 'High',
      maintenanceCostPrediction: predictMaintenanceCost(vehicles, expenses, recentMaintenance),
      recentAlerts,
      upcomingServices: upcomingAppointments.map((a) => ({
        id: a._id,
        type: a.serviceType || 'service',
        date: a.scheduledDate || null,
        center: a.serviceCenter?.name || 'Unknown',
      })),
      monthlyExpense: monthlyExpenses,
      drivingScore,
      fuelTrend,
      predictionSummary,
      vehicleSelector: vehicles.map((vehicle) => ({
        id: vehicle._id,
        name: vehicle.vehicleName || `${vehicle.manufacturer} ${vehicle.model}`,
        registrationNumber: vehicle.registrationNumber,
        image: vehicle.images?.[0] || null,
        healthScore: vehicle.healthScore,
      })),
      recentMaintenance: recentMaintenance.map((m) => ({
        id: m._id,
        title: m.title || 'Maintenance task',
        date: m.serviceDate || null,
        cost: typeof m.cost?.total === 'number' ? m.cost.total : 0,
        center: m.serviceCenter?.name || 'Unknown',
      })),
      unreadNotifications: notifications.length,
      notifications: notifications.slice(0, 5).map((n) => ({
        id: n._id,
        title: n.title || 'Notification',
        message: n.message || '',
        type: n.type || 'info',
        priority: n.priority || 'low',
        createdAt: n.createdAt || null,
      })),
    };

    res.status(200).json({ ok: true, dashboard });
  } catch (error) {
    res.status(500).json({ ok: false, error: error?.message || 'Unable to build dashboard' });
  }
};

// Helpers
function getEmptyDashboard() {
  return {
    vehicleSummary: { totalVehicles: 0, primaryVehicle: null },
    healthScore: 0,
    engineHealth: 0,
    batteryHealth: 0,
    brakeHealth: 0,
    tyreHealth: 0,
    transmissionHealth: 0,
    fuelEfficiency: 0,
    serviceDueCountdown: null,
    riskPrediction: 'N/A',
    maintenanceCostPrediction: 0,
    recentAlerts: [],
    upcomingServices: [],
    monthlyExpense: [],
    drivingScore: 0,
    fuelTrend: [],
    predictionSummary: {},
    recentMaintenance: [],
    unreadNotifications: 0,
    notifications: [],
  };
}

function calculateDrivingScore(fuelLogs) {
  const mileages = fuelLogs
    .filter((f) => typeof f.mileage === 'number')
    .map((f) => f.mileage);
  if (mileages.length < 3) return 0;
  const avg = mileages.reduce((a, b) => a + b, 0) / mileages.length;
  if (avg === 0) return 0;
  const consistency = 1 - Math.min(Math.abs(mileages[0] - avg) / avg, 0.3);
  return Math.round(Math.max(0, Math.min(100, consistency * 100)));
}

function aggregateMonthlyExpenses(expenses) {
  const monthlyMap = {};
  expenses.forEach((e) => {
    const date = e?.date instanceof Date ? e.date : new Date(e?.date);
    if (!date || Number.isNaN(date.getTime())) return;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyMap[key] = (monthlyMap[key] || 0) + (typeof e.amount === 'number' ? e.amount : 0);
  });
  return Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([, amount]) => Math.round(amount));
}

function predictMaintenanceCost(_vehicles, expenses, recentMaintenance) {
  const hasMaintenanceData = Array.isArray(recentMaintenance) && recentMaintenance.length > 0;
  const hasMaintenanceExpenses =
    Array.isArray(expenses) && expenses.some((e) => e && ['service', 'repair'].includes(e.category));

  // Requirement: only estimate when user has uploaded/created maintenance-related reports.
  if (!hasMaintenanceData && !hasMaintenanceExpenses) return 0;

  if (!Array.isArray(expenses) || expenses.length === 0) return 0;

  const maintenanceExpenses = expenses.filter(
    (e) => e && typeof e.category === 'string' && ['service', 'repair'].includes(e.category)
  );

  if (maintenanceExpenses.length === 0) return 0;

  const avg =
    maintenanceExpenses.reduce((sum, e) => sum + (typeof e.amount === 'number' ? e.amount : 0), 0) /
    maintenanceExpenses.length;

  return Math.round(avg || 0);
}

