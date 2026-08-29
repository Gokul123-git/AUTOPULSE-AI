import HealthReading from '../models/HealthReading.js';
import Vehicle from '../models/Vehicle.js';
import Prediction from '../models/Prediction.js';
import { generateInspectionAnalysis } from '../utils/inspectionPredictionEngine.js';

const healthFromReading = (r) => {
  const pressure = Object.values(r.tyrePressure || {}).filter(Number.isFinite);
  const pressurePenalty = pressure.length ? Math.round(pressure.reduce((sum, value) => sum + Math.min(15, Math.abs(value - 32) * 2), 0) / pressure.length) : 0;
  const enginePenalty = (r.checkEngineLight ? 25 : 0) + (r.engineTemperature > 105 ? 20 : 0) + (r.engineOilLevel === 'low' ? 15 : 0) + ({ none: 0, low: 5, medium: 14, high: 25 }[r.smokeLevel] || 0) + ({ normal: 0, medium: 6, high: 15 }[r.noiseLevel] || 0);
  const batteryPenalty = r.batteryVoltage && r.batteryVoltage < 12.2 ? Math.min(35, Math.round((12.2 - r.batteryVoltage) * 20)) : 0;
  const tyreHealth = Math.max(20, 100 - pressurePenalty - Math.round((r.vibrationLevel || 0) / 4));
  return {
    currentOdometer: r.currentOdometer,
    engineTemperature: r.engineTemperature,
    engineHealth: Math.max(15, 100 - enginePenalty),
    batteryHealth: Math.max(20, 100 - batteryPenalty),
    brakeHealth: r.brakeCondition ?? 80,
    tyreHealth,
    coolingSystemHealth: Math.max(20, 100 - (r.coolantLevel === 'low' ? 25 : 0) - (r.engineTemperature > 105 ? 20 : 0)),
    oilHealth: r.engineOilLevel === 'low' ? 40 : 90,
    transmissionHealth: Math.max(40, 100 - Math.round((r.vibrationLevel || 0) / 3)),
    fuelEfficiency: r.averageFuelEfficiency,
  };
};

export const getHealthReadings = async (req, res) => {
  const filter = { owner: req.user._id };
  if (req.query.vehicleId) filter.vehicle = req.query.vehicleId;
  const readings = await HealthReading.find(filter).sort('-createdAt').limit(30);
  res.json({ ok: true, readings });
};

export const createHealthReading = async (req, res) => {
  try {
    const requiredFields = ['vehicleId', 'currentOdometer', 'engineTemperature', 'engineOilLevel', 'engineRpm', 'batteryVoltage', 'batteryHealth', 'fuelLevel', 'averageFuelEfficiency', 'brakeCondition', 'tyreWear', 'coolantLevel', 'lastServiceDate'];
    const missing = requiredFields.filter((field) => req.body[field] === undefined || req.body[field] === null || req.body[field] === '');
    const pressure = req.body.tyrePressure || {};
    const missingPressure = ['fl', 'fr', 'rl', 'rr'].filter((field) => pressure[field] === undefined || pressure[field] === null || pressure[field] === '');
    if (missing.length || missingPressure.length) {
      return res.status(400).json({ ok: false, error: `Complete the required inspection inputs: ${[...missing, ...missingPressure.map((field) => `tyrePressure.${field}`)].join(', ')}.` });
    }
    const vehicle = await Vehicle.findById(req.body.vehicleId);
    if (!vehicle) return res.status(404).json({ ok: false, error: 'Vehicle not found.' });
    if (vehicle.owner.toString() !== req.user._id.toString()) return res.status(403).json({ ok: false, error: 'You can only add readings for your own vehicle.' });
    const reading = await HealthReading.create({ ...req.body, vehicle: vehicle._id, owner: req.user._id });
    const analysis = generateInspectionAnalysis(reading.toObject());
    reading.analysis = analysis;
    await reading.save();
    Object.assign(vehicle, { healthScore: analysis.overallHealth, engineHealth: analysis.engineHealth, batteryHealth: analysis.batteryHealth, brakeHealth: analysis.brakeHealth, tyreHealth: analysis.tyreHealth, lastServiceDate: reading.lastServiceDate });
    await vehicle.save();
    await Prediction.updateMany({ vehicle: vehicle._id, status: 'active', modelVersion: 'inspection-rules-v1' }, { status: 'resolved' });
    const categories = ['engine_failure', 'battery_failure', 'brake_wear', 'tyre_wear'];
    await Prediction.insertMany(analysis.components.map((item, index) => ({ vehicle: vehicle._id, owner: req.user._id, category: categories[index], riskPercentage: item.risk, confidenceScore: analysis.dataCompleteness, severity: item.severity, reason: item.reasons.join(' '), recommendedAction: item.recommendation, estimatedRepairCost: item.estimatedCost, estimatedTimeBeforeFailure: item.recommendedWithinDays, modelVersion: analysis.source, inputFeatures: req.body, rawResponse: item })));
    res.status(201).json({ ok: true, message: 'Inspection saved and AI analysis generated successfully.', reading, analysis });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message || 'Unable to save health readings.' });
  }
};
