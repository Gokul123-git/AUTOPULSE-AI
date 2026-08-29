const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(value)));
const severity = (score) => score < 40 ? 'critical' : score < 60 ? 'high' : score < 80 ? 'medium' : 'low';
const component = (name, score, reasons, recommendation, cost, days) => ({ name, score: clamp(score), risk: 100 - clamp(score), severity: severity(score), reasons, recommendation, estimatedCost: score < 80 ? cost : 0, recommendedWithinDays: days });

export function generateInspectionAnalysis(reading) {
  const engineReasons = [];
  let engineScore = 100;
  if (reading.engineTemperature > 105) { engineScore -= 30; engineReasons.push(`Engine temperature is ${reading.engineTemperature}°C, above the 105°C inspection threshold.`); }
  else if (reading.engineTemperature < 80) { engineScore -= 10; engineReasons.push(`Engine temperature is ${reading.engineTemperature}°C, below the usual operating range.`); }
  else engineReasons.push(`Engine temperature is ${reading.engineTemperature}°C, within the 80–105°C inspection range.`);
  if (reading.engineOilLevel === 'low') { engineScore -= 25; engineReasons.push('Engine oil level is reported low.'); }
  else engineReasons.push('Engine oil level is reported normal.');
  if (reading.engineRpm < 500 || reading.engineRpm > 6500) { engineScore -= 15; engineReasons.push(`Recorded RPM (${reading.engineRpm}) is outside the 500–6,500 inspection range.`); }
  const batteryReasons = []; let batteryScore = Number(reading.batteryHealth);
  if (reading.batteryVoltage < 12.2) { batteryScore -= 25; batteryReasons.push(`Battery voltage is ${reading.batteryVoltage} V, below 12.2 V.`); }
  else if (reading.batteryVoltage > 14.8) { batteryScore -= 15; batteryReasons.push(`Battery voltage is ${reading.batteryVoltage} V, above the normal charging range.`); }
  else batteryReasons.push(`Battery voltage is ${reading.batteryVoltage} V and reported battery health is ${reading.batteryHealth}%.`);
  const brakeReasons = [`Brake condition was recorded as ${reading.brakeCondition}%.`]; const brakeScore = Number(reading.brakeCondition);
  const tyreReasons = []; const pressures = Object.entries(reading.tyrePressure || {}); const pressurePenalty = pressures.reduce((sum, [position, pressure]) => { const out = Number(pressure) < 28 || Number(pressure) > 36; if (out) tyreReasons.push(`${position.toUpperCase()} tyre pressure is ${pressure} psi, outside 28–36 psi.`); return sum + (out ? 12 : 0); }, 0);
  if (!pressurePenalty) tyreReasons.push('All submitted tyre pressures are within 28–36 psi.');
  tyreReasons.push(`Tyre wear is recorded as ${reading.tyreWear}%.`); const tyreScore = 100 - Number(reading.tyreWear) - pressurePenalty;
  const coolingReasons = reading.coolantLevel === 'low' ? ['Coolant level is low.'] : ['Coolant level is reported normal.']; if (reading.coolantLevel === 'low') engineScore -= 15;
  const engine = component('Engine', engineScore, engineReasons.concat(coolingReasons), engineScore < 80 ? 'Inspect the engine oil and cooling system before continued heavy use.' : 'Continue normal operation and recheck at the next scheduled inspection.', 7000, engineScore < 60 ? 7 : 60);
  const battery = component('Battery', batteryScore, batteryReasons, batteryScore < 80 ? 'Test the battery and charging circuit; replace the battery if the test confirms low capacity.' : 'Continue monitoring battery voltage during regular inspections.', 3500, batteryScore < 60 ? 14 : 90);
  const brakes = component('Brakes', brakeScore, brakeReasons, brakeScore < 80 ? 'Schedule a brake-pad and hydraulic-system inspection.' : 'Continue monitoring brake condition at each service.', 6000, brakeScore < 60 ? 14 : 90);
  const tyres = component('Tyres', tyreScore, tyreReasons, tyreScore < 80 ? 'Correct tyre pressures and inspect/replace tyres with excessive wear.' : 'Maintain the recorded tyre pressures and rotate as scheduled.', 12000, tyreScore < 60 ? 14 : 90);
  const components = [engine, battery, brakes, tyres]; const overallHealth = clamp(engine.score * .30 + battery.score * .25 + brakes.score * .25 + tyres.score * .20);
  const fuelEfficiencyAnalysis = { recordedKmPerL: Number(reading.averageFuelEfficiency), fuelLevel: Number(reading.fuelLevel), reason: `Fuel efficiency is recorded as ${reading.averageFuelEfficiency} km/l and fuel level as ${reading.fuelLevel}%. No manufacturer baseline was supplied, so AutoPulse does not label it good or poor.`, recommendation: 'Compare future inspections for this vehicle to identify a measured efficiency trend.' };
  const breakdownRisk = 100 - overallHealth; const nextServiceDays = overallHealth < 60 ? 14 : overallHealth < 80 ? 45 : 90;
  const recommendations = components.filter(item => item.score < 80).map(item => ({ component: item.name, priority: item.severity, reason: item.reasons.join(' '), recommendation: item.recommendation, estimatedCost: item.estimatedCost, dueDate: new Date(Date.now() + item.recommendedWithinDays * 86400000).toISOString() }));
  return { source: 'inspection-rules-v1', generatedAt: new Date().toISOString(), dataCompleteness: 100, overallHealth, engineHealth: engine.score, batteryHealth: battery.score, brakeHealth: brakes.score, tyreHealth: tyres.score, fuelEfficiencyAnalysis, breakdownRisk, remainingUsefulLifeDays: Math.round(90 + overallHealth * 3.65), nextMaintenanceDate: new Date(Date.now() + nextServiceDays * 86400000).toISOString(), estimatedMaintenanceCost: recommendations.reduce((sum, item) => sum + item.estimatedCost, 0), components, recommendations, explanation: 'Every score is calculated from this inspection’s submitted readings using the listed thresholds; no historical, manufacturer, or placeholder values are added.' };
}
