import Vehicle from '../models/Vehicle.js';
import VehicleAssessment from '../models/VehicleAssessment.js';
import Prediction from '../models/Prediction.js';

// These fields are the minimum evidence needed for a safe component-level assessment.
const required = ['engineTemperature', 'engineOilPressure', 'engineOilLevel', 'coolantTemperature', 'coolantLevel', 'rpm', 'batteryVoltage', 'batteryHealth', 'alternatorOutput', 'fuelLevel', 'fuelEfficiency', 'frontLeftTirePressure', 'frontRightTirePressure', 'rearLeftTirePressure', 'rearRightTirePressure', 'tireWearPercentage', 'brakePadWear', 'brakeFluidLevel', 'absStatus', 'suspensionCondition', 'sensorHealth', 'averageSpeed', 'harshBrakingCount', 'idleTime', 'lastServiceDate'];
const number = (v) => Number.isFinite(Number(v)) ? Number(v) : null;
const present = (v) => v !== undefined && v !== null && v !== '';
const score = (penalties) => Math.max(0, 100 - penalties.reduce((sum, p) => sum + p.points, 0));
const reason = (condition, text, points) => condition ? { text, points } : null;

export const assessmentRequirements = (_req, res) => res.json({ ok: true, requiredFields: required, groups: { engine: required.slice(0, 6), battery: required.slice(6, 9), tyres: required.slice(11, 16), brakes: required.slice(16, 19), driving: required.slice(22) } });

export const latestAssessment = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.vehicleId);
    if (!vehicle) return res.status(404).json({ ok: false, error: 'Vehicle not found.' });
    if (vehicle.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') return res.status(403).json({ ok: false, error: 'Not authorized.' });
    const assessment = await VehicleAssessment.findOne({ vehicle: vehicle._id }).sort('-createdAt');
    res.json({ ok: true, assessment: assessment || null });
  } catch (error) { res.status(400).json({ ok: false, error: error.message }); }
};

export const assessmentHistory = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.vehicleId);
    if (!vehicle) return res.status(404).json({ ok: false, error: 'Vehicle not found.' });
    if (vehicle.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') return res.status(403).json({ ok: false, error: 'Not authorized.' });
    const assessments = await VehicleAssessment.find({ vehicle: vehicle._id, analysedAt: { $ne: null } }).select('analysis analysedAt createdAt').sort('createdAt').limit(60);
    res.json({ ok: true, assessments });
  } catch (error) { res.status(400).json({ ok: false, error: error.message }); }
};

export const saveAssessment = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.vehicleId);
    if (!vehicle) return res.status(404).json({ ok: false, error: 'Vehicle not found.' });
    if (vehicle.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') return res.status(403).json({ ok: false, error: 'Not authorized.' });
    const data = req.body.data || req.body;
    const missingFields = required.filter((key) => !present(data[key]));
    const completeness = Math.round(((required.length - missingFields.length) / required.length) * 100);
    const assessment = await VehicleAssessment.create({ vehicle: vehicle._id, owner: vehicle.owner, data, source: req.body.source || 'manual', completeness, missingFields });
    if (missingFields.length) return res.status(201).json({ ok: true, assessment, ready: false, missingFields, message: 'More measured inputs are required before an accurate analysis can be produced.' });
    const analysis = analyse(data, vehicle);
    assessment.analysis = analysis; assessment.analysedAt = new Date(); await assessment.save();
    Object.assign(vehicle, analysis.scores); await vehicle.save();
    await Prediction.updateMany({ vehicle: vehicle._id, status: 'active' }, { status: 'resolved' });
    const predictions = await Prediction.insertMany(analysis.components.map((item) => ({ vehicle: vehicle._id, owner: vehicle.owner, category: item.category, riskPercentage: 100 - item.score, confidenceScore: 90, severity: item.severity, reason: item.reasons.join(' '), recommendedAction: item.recommendation, estimatedRepairCost: item.cost, estimatedTimeBeforeFailure: item.days, modelVersion: 'transparent-rules-v2', inputFeatures: data, rawResponse: { rules: item.reasons } })));
    res.status(201).json({ ok: true, assessment, ready: true, analysis, predictions });
  } catch (error) { res.status(400).json({ ok: false, error: error.message || 'Unable to save assessment.' }); }
};

function analyse(d, vehicle) {
  const engine = [reason(number(d.engineTemperature) > 105, 'Engine temperature is above 105°C.', 25), reason(number(d.engineOilPressure) < 20, 'Oil pressure is below 20 psi.', 25), reason(String(d.engineOilLevel).toLowerCase() === 'low', 'Engine oil level is low.', 20), reason(number(d.coolantTemperature) > 105 || String(d.coolantLevel).toLowerCase() === 'low', 'Cooling system needs attention.', 20)].filter(Boolean);
  const battery = [reason(number(d.batteryVoltage) < 12.2, 'Battery voltage is below 12.2 V.', 30), reason(number(d.batteryHealth) < 70, 'Reported battery health is below 70%.', 25), reason(number(d.alternatorOutput) < 13.5 || number(d.alternatorOutput) > 14.8, 'Alternator output is outside 13.5–14.8 V.', 20)].filter(Boolean);
  const tyres = ['frontLeftTirePressure','frontRightTirePressure','rearLeftTirePressure','rearRightTirePressure'].map(k => reason(Math.abs(number(d[k]) - 32) > 4, `${k.replace(/([A-Z])/g, ' $1')} is outside 28–36 psi.`, 10)).filter(Boolean).concat([reason(number(d.tireWearPercentage) > 70, 'Tire wear exceeds 70%.', 35)].filter(Boolean));
  const brakes = [reason(number(d.brakePadWear) > 70, 'Brake pad wear exceeds 70%.', 40), reason(String(d.brakeFluidLevel).toLowerCase() === 'low', 'Brake fluid level is low.', 25), reason(String(d.absStatus).toLowerCase() !== 'normal' && String(d.absStatus).toLowerCase() !== 'ok', 'ABS status requires inspection.', 25)].filter(Boolean);
  const components = [
    make('engine_failure', 'Engine', engine, 'Inspect engine, oil and cooling system.', 7000), make('battery_failure', 'Battery', battery, 'Test battery and charging circuit.', 3500), make('tyre_wear', 'Tyres', tyres, 'Check tire pressures and replace worn tires.', 12000), make('brake_wear', 'Brakes', brakes, 'Schedule a brake inspection immediately.', 6000),
  ];
  const componentScores = components.map(x => x.score); const overall = Math.round(componentScores.reduce((a,b) => a + b, 0) / componentScores.length);
  const serviceDays = Math.max(1, Math.round(180 * overall / 100)); const totalCost = components.filter(x => x.score < 80).reduce((sum, x) => sum + x.cost, 0);
  return { scores: { healthScore: overall, engineHealth: components[0].score, batteryHealth: components[1].score, tyreHealth: components[2].score, brakeHealth: components[3].score }, components, overallHealth: overall, breakdownProbability: 100 - overall, remainingUsefulLifeDays: Math.round(365 * overall / 100), nextServiceDate: new Date(Date.now() + serviceDays * 86400000).toISOString(), estimatedMaintenanceCost: totalCost, explanation: 'Scores are calculated only from the submitted measurements. Each deduction is listed under its component.' };
}
function make(category, name, penalties, recommendation, cost) { const value = score(penalties); return { category, name, score: value, severity: value < 40 ? 'critical' : value < 60 ? 'high' : value < 80 ? 'medium' : 'low', reasons: penalties.length ? penalties.map(x => x.text) : ['All supplied readings are within the configured rule ranges.'], recommendation, cost: value < 80 ? cost : 0, days: value < 40 ? 7 : value < 60 ? 30 : 180 }; }
