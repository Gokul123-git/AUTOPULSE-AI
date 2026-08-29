import Prediction from '../models/Prediction.js';
import Vehicle from '../models/Vehicle.js';

// GET /api/predictions
export const getPredictions = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role !== 'admin') filter.owner = req.user._id;
    if (req.query.vehicle) filter.vehicle = req.query.vehicle;
    if (req.query.status) filter.status = req.query.status;

    const predictions = await Prediction.find(filter)
      .populate('vehicle', 'manufacturer model registrationNumber')
      .sort('-createdAt');

    res.status(200).json({ ok: true, count: predictions.length, predictions });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// POST /api/predictions
export const createPrediction = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.body.vehicle);
    if (!vehicle) return res.status(404).json({ ok: false, error: 'Vehicle not found' });
    if (req.user.role !== 'admin' && vehicle.owner.toString() !== req.user._id.toString()) return res.status(403).json({ ok: false, error: 'Not authorized to create analysis for this vehicle' });
    const prediction = await Prediction.create({
      ...req.body,
      owner: req.user._id,
    });
    res.status(201).json({ ok: true, prediction });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// PUT /api/predictions/:id
export const updatePrediction = async (req, res) => {
  try {
    const existing = await Prediction.findById(req.params.id);
    if (!existing) return res.status(404).json({ ok: false, error: 'Prediction not found' });
    if (req.user.role !== 'admin' && existing.owner.toString() !== req.user._id.toString()) return res.status(403).json({ ok: false, error: 'Not authorized' });
    const prediction = await Prediction.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!prediction) return res.status(404).json({ ok: false, error: 'Prediction not found' });
    res.status(200).json({ ok: true, prediction });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// DELETE /api/predictions/:id
export const deletePrediction = async (req, res) => {
  try {
    const prediction = await Prediction.findById(req.params.id);
    if (!prediction) return res.status(404).json({ ok: false, error: 'Prediction not found' });
    if (req.user.role !== 'admin' && prediction.owner.toString() !== req.user._id.toString()) return res.status(403).json({ ok: false, error: 'Not authorized' });
    await prediction.deleteOne();
    res.status(200).json({ ok: true, message: 'Prediction deleted' });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// POST /api/predictions/analyze
export const runPrediction = async (req, res) => {
  return res.status(410).json({ ok: false, error: 'Direct prediction generation is disabled. Complete the AI Vehicle Assessment first so analysis is based on measured evidence.', assessmentEndpoint: `/api/assessments/${req.body.vehicleId || ':vehicleId'}` });
  /* legacy non-evidence-based path retained below only for migration reference
  try {
    const { vehicleId, healthMetrics = {} } = req.body;
    if (!vehicleId) {
      return res.status(400).json({ ok: false, error: 'vehicleId is required for analysis' });
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ ok: false, error: 'Vehicle not found' });
    if (req.user.role === 'vehicle_owner' && vehicle.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ ok: false, error: 'Not authorized to analyze this vehicle' });
    }

    const healthFields = [
      'engineHealth', 'batteryHealth', 'brakeHealth', 'tyreHealth',
      'transmissionHealth', 'coolingSystemHealth', 'oilHealth',
    ];
    const unsupportedMetric = Object.keys(healthMetrics).find(
      (metric) => !healthFields.includes(metric) && !['currentOdometer', 'engineTemperature', 'fuelEfficiency'].includes(metric)
    );
    if (unsupportedMetric) {
      return res.status(400).json({ ok: false, error: `Unsupported analysis input: ${unsupportedMetric}` });
    }

    const invalidMetric = Object.entries(healthMetrics).find(([metric, value]) =>
      !Number.isFinite(Number(value)) || Number(value) < 0 || (healthFields.includes(metric) && Number(value) > 100) || (metric === 'engineTemperature' && Number(value) > 200)
    );
    if (invalidMetric) {
      return res.status(400).json({
        ok: false,
        error: `${invalidMetric[0]} must be a number between 0 and 100`,
      });
    }

    const input = {
      engineHealth: vehicle.engineHealth,
      batteryHealth: vehicle.batteryHealth,
      brakeHealth: vehicle.brakeHealth,
      tyreHealth: vehicle.tyreHealth,
      transmissionHealth: vehicle.transmissionHealth,
      coolingSystemHealth: vehicle.coolingSystemHealth,
      oilHealth: vehicle.oilHealth,
      currentOdometer: vehicle.currentOdometer,
      engineTemperature: vehicle.engineTemperature,
      ...healthMetrics,
    };

    const predictions = generatePredictions(vehicle, req.user._id, input);
    const saved = await Prediction.insertMany(predictions);

    // Acknowledge old predictions for same vehicle
    await Prediction.updateMany(
      { vehicle: vehicleId, status: 'active', _id: { $nin: saved.map((s) => s._id) } },
      { status: 'resolved' }
    );

    const overallHealth = Math.round(
      ['engineHealth', 'batteryHealth', 'brakeHealth', 'tyreHealth', 'transmissionHealth', 'coolingSystemHealth', 'oilHealth']
        .reduce((sum, metric) => sum + Number(input[metric]), 0) / 7
    );
    Object.assign(vehicle, {
      engineHealth: Number(input.engineHealth),
      batteryHealth: Number(input.batteryHealth),
      brakeHealth: Number(input.brakeHealth),
      tyreHealth: Number(input.tyreHealth),
      transmissionHealth: Number(input.transmissionHealth),
      coolingSystemHealth: Number(input.coolingSystemHealth),
      oilHealth: Number(input.oilHealth),
      currentOdometer: Number(input.currentOdometer),
      engineTemperature: input.engineTemperature === undefined || input.engineTemperature === null ? vehicle.engineTemperature : Number(input.engineTemperature),
      healthScore: overallHealth,
    });
    await vehicle.save();
    const highestRisk = saved.reduce((highest, item) => Math.max(highest, item.riskPercentage), 0);
    const usefulLifeDays = Math.max(30, Math.round(365 * (overallHealth / 100)));
    const nextServiceDate = new Date(Date.now() + Math.max(14, Math.round(180 * (overallHealth / 100))) * 86400000);
    res.status(201).json({
      ok: true,
      analysis: {
        vehicleId: vehicle._id,
        overallHealth,
        overallVehicleStatus: overallHealth >= 80 ? 'Excellent' : overallHealth >= 60 ? 'Attention recommended' : 'Service required',
        servicePriority: getSeverity(highestRisk),
        breakdownRisk: highestRisk,
        remainingUsefulLifeDays: usefulLifeDays,
        predictedNextServiceDate: nextServiceDate.toISOString(),
        estimatedMaintenanceCost: saved.find((item) => item.category === 'maintenance_cost')?.estimatedRepairCost || 0,
        engineTemperature: input.engineTemperature ?? vehicle.engineTemperature ?? null,
        engineTemperatureStatus: input.engineTemperature === undefined || input.engineTemperature === null
          ? 'No live temperature reading available'
          : Number(input.engineTemperature) > 105 ? 'High — inspect cooling system' : 'Normal',
        fuelEfficiency: input.fuelEfficiency ?? null,
        fuelEfficiencyStatus: input.fuelEfficiency === undefined ? 'No fuel-log data available' : 'Recorded from vehicle data',
        riskLevel: getSeverity(100 - overallHealth),
        analyzedInputs: input,
        generatedAt: new Date().toISOString(),
      },
      count: saved.length,
      predictions: saved,
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
  */
};

function generatePredictions(vehicle, ownerId, input) {
  const now = new Date();
  const validUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const basePredictions = [
    {
      vehicle: vehicle._id,
      owner: ownerId,
      category: 'engine_failure',
      riskPercentage: riskFromHealth(input.engineHealth, 5),
      confidenceScore: confidenceFromHealth(input.engineHealth),
      severity: getSeverity(riskFromHealth(input.engineHealth, 5)),
      reason: 'Based on odometer readings and service history intervals',
      recommendedAction: input.engineHealth < 70 ? 'Schedule engine diagnostic test' : 'Continue regular maintenance',
      estimatedRepairCost: input.engineHealth < 60 ? 5000 : 1500,
      estimatedTimeBeforeFailure: input.engineHealth < 60 ? 90 : 365,
      validUntil,
    },
    {
      vehicle: vehicle._id,
      owner: ownerId,
      category: 'battery_failure',
      riskPercentage: riskFromHealth(input.batteryHealth, 3),
      confidenceScore: confidenceFromHealth(input.batteryHealth),
      severity: getSeverity(riskFromHealth(input.batteryHealth, 3)),
      reason: 'Battery age and voltage pattern analysis',
      recommendedAction: input.batteryHealth < 60 ? 'Replace battery within 30 days' : 'Check battery terminals',
      estimatedRepairCost: input.batteryHealth < 50 ? 3000 : 800,
      estimatedTimeBeforeFailure: input.batteryHealth < 50 ? 30 : 180,
      validUntil,
    },
    {
      vehicle: vehicle._id,
      owner: ownerId,
      category: 'brake_wear',
      riskPercentage: riskFromHealth(input.brakeHealth, 8),
      confidenceScore: confidenceFromHealth(input.brakeHealth),
      severity: getSeverity(riskFromHealth(input.brakeHealth, 8)),
      reason: 'Brake pad thickness estimation from mileage data',
      recommendedAction: input.brakeHealth < 50 ? 'Inspect and replace brake pads' : 'Monitor brake performance',
      estimatedRepairCost: input.brakeHealth < 40 ? 2000 : 600,
      estimatedTimeBeforeFailure: input.brakeHealth < 40 ? 60 : 240,
      validUntil,
    },
    {
      vehicle: vehicle._id,
      owner: ownerId,
      category: 'tyre_wear',
      riskPercentage: riskFromHealth(input.tyreHealth, 5),
      confidenceScore: confidenceFromHealth(input.tyreHealth),
      severity: getSeverity(riskFromHealth(input.tyreHealth, 5)),
      reason: 'Tyre tread depth projection based on usage patterns',
      recommendedAction: input.tyreHealth < 50 ? 'Rotate or replace tyres' : 'Maintain proper tyre pressure',
      estimatedRepairCost: input.tyreHealth < 40 ? 3000 : 500,
      estimatedTimeBeforeFailure: input.tyreHealth < 50 ? 45 : 210,
      validUntil,
    },
    {
      vehicle: vehicle._id,
      owner: ownerId,
      category: 'oil_replacement',
      riskPercentage: riskFromHealth(input.oilHealth, 10),
      confidenceScore: confidenceFromHealth(input.oilHealth),
      severity: getSeverity(riskFromHealth(input.oilHealth, 10)),
      reason: 'Oil degradation analysis based on mileage and time',
      recommendedAction: input.oilHealth < 40 ? 'Schedule immediate oil change' : 'Plan oil change soon',
      estimatedRepairCost: 200,
      estimatedTimeBeforeFailure: input.oilHealth < 30 ? 7 : 45,
      validUntil,
    },
    {
      vehicle: vehicle._id,
      owner: ownerId,
      category: 'maintenance_cost',
      riskPercentage: Math.min(100, Math.round((100 - averageHealth(input)) * 0.6 + Math.min(input.currentOdometer / 10000, 25))),
      confidenceScore: 82,
      severity: getSeverity(Math.min(100, Math.round((100 - averageHealth(input)) * 0.6 + Math.min(input.currentOdometer / 10000, 25)))),
      reason: 'Projected maintenance cost for next 6 months',
      recommendedAction: 'Budget for upcoming maintenance expenses',
      estimatedRepairCost: Math.round(2000 + (100 - averageHealth(input)) * 50),
      estimatedTimeBeforeFailure: 180,
      validUntil,
    },
  ];

  return basePredictions.map((prediction) => ({
    ...prediction,
    modelVersion: 'rule-based-v1',
    inputFeatures: input,
  }));
}

function riskFromHealth(health, baseline) {
  return Math.max(baseline, Math.min(100, Math.round(100 - Number(health))));
}

function confidenceFromHealth(health) {
  return Math.min(98, Math.max(75, Math.round(80 + Math.abs(50 - Number(health)) * 0.3)));
}

function getSeverity(risk) {
  if (risk >= 75) return 'critical';
  if (risk >= 50) return 'high';
  if (risk >= 25) return 'medium';
  return 'low';
}

function averageHealth(input) {
  const metrics = ['engineHealth', 'batteryHealth', 'brakeHealth', 'tyreHealth', 'transmissionHealth', 'coolingSystemHealth', 'oilHealth'];
  return metrics.reduce((sum, metric) => sum + Number(input[metric]), 0) / metrics.length;
}
