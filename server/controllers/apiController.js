const buildResponse = (res, statusCode, payload) => {
  res.status(statusCode).json(payload);
};

export const getHealth = (_req, res) => {
  buildResponse(res, 200, {
    ok: true,
    service: 'AutoPulse AI API',
    status: 'operational',
    version: '1.0.0',
    environment: 'production-ready-demo',
    timestamp: new Date().toISOString(),
  });
};

export const getMetrics = (_req, res) => {
  buildResponse(res, 200, {
    fleetHealth: 94,
    appointmentsToday: 18,
    openAlerts: 6,
    predictionAccuracy: 97.4,
    monthlyRevenue: 124500,
    serviceCoverage: 89,
  });
};
