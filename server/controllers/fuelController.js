import FuelLog from '../models/FuelLog.js';

// GET /api/fuel
export const getFuelLogs = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'vehicle_owner') {
      filter.owner = req.user._id;
    }
    if (req.query.vehicle) filter.vehicle = req.query.vehicle;
    const logs = await FuelLog.find(filter)
      .populate('vehicle', 'manufacturer model registrationNumber fuelType')
      .sort('-date');
    res.status(200).json({ ok: true, count: logs.length, logs });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// POST /api/fuel
export const createFuelLog = async (req, res) => {
  try {
    const logData = { ...req.body, owner: req.user._id };
    if (req.file) logData.billImage = `/uploads/${req.file.filename}`;
    const log = await FuelLog.create(logData);
    res.status(201).json({ ok: true, log });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// PUT /api/fuel/:id
export const updateFuelLog = async (req, res) => {
  try {
    const log = await FuelLog.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!log) return res.status(404).json({ ok: false, error: 'Fuel log not found' });
    res.status(200).json({ ok: true, log });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// DELETE /api/fuel/:id
export const deleteFuelLog = async (req, res) => {
  try {
    const log = await FuelLog.findByIdAndDelete(req.params.id);
    if (!log) return res.status(404).json({ ok: false, error: 'Fuel log not found' });
    res.status(200).json({ ok: true, message: 'Fuel log deleted' });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// GET /api/fuel/analytics
export const getFuelAnalytics = async (req, res) => {
  try {
    const logs = await FuelLog.find({ owner: req.user._id }).sort('date');
    if (logs.length === 0) {
      return res.status(200).json({ ok: true, analytics: getEmptyFuelAnalytics() });
    }

    const totalSpent = logs.reduce((sum, l) => sum + l.totalCost, 0);
    const totalFuel = logs.reduce((sum, l) => sum + l.quantity, 0);
    const avgMileage = logs.filter((l) => l.mileage).reduce((sum, l, _, arr) => sum + l.mileage / arr.filter((x) => x.mileage).length, 0);

    // Monthly trend
    const monthlyMap = {};
    logs.forEach((l) => {
      const key = `${l.date.getFullYear()}-${String(l.date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap[key]) monthlyMap[key] = { cost: 0, quantity: 0 };
      monthlyMap[key].cost += l.totalCost;
      monthlyMap[key].quantity += l.quantity;
    });

    const monthlyTrend = Object.entries(monthlyMap).map(([month, data]) => ({ month, ...data }));

    res.status(200).json({
      ok: true,
      analytics: {
        totalSpent: Math.round(totalSpent),
        totalFuel: Math.round(totalFuel * 100) / 100,
        avgMileage: Math.round(avgMileage * 100) / 100,
        totalRefills: logs.length,
        monthlyTrend,
        efficiencyScore: avgMileage > 15 ? 'Excellent' : avgMileage > 12 ? 'Good' : avgMileage > 9 ? 'Average' : 'Poor',
        suggestions: generateFuelSuggestions(avgMileage, logs[0]?.fuelType),
      },
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

function getEmptyFuelAnalytics() {
  return {
    totalSpent: 0,
    totalFuel: 0,
    avgMileage: 0,
    totalRefills: 0,
    monthlyTrend: [],
    efficiencyScore: 'N/A',
    suggestions: [],
  };
}

function generateFuelSuggestions(avgMileage, fuelType) {
  const suggestions = [];
  if (avgMileage < 12) {
    suggestions.push('Check tyre pressure regularly for better mileage');
    suggestions.push('Avoid aggressive acceleration and sudden braking');
    suggestions.push('Get your engine tuned for optimal fuel efficiency');
  }
  if (fuelType === 'petrol') {
    suggestions.push('Use recommended octane rating fuel only');
    suggestions.push('Replace air filter every 15,000 km');
  } else if (fuelType === 'diesel') {
    suggestions.push('Ensure timely diesel filter replacement');
    suggestions.push('Avoid idling for more than 2 minutes');
  }
  return suggestions;
}
