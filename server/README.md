# AutoPulse AI Server

This Express API provides a demo backend for the AutoPulse AI platform.

## Endpoints
- GET /api/health
- GET /api/dashboard
- GET, POST, PUT, DELETE /api/vehicles
- POST /api/predictions/analyze

## Vehicle analysis

Send an authenticated request with a saved vehicle id. `healthMetrics` is optional;
provided values override the vehicle's saved health data for that one analysis.

```json
{
  "vehicleId": "<vehicle-id>",
  "healthMetrics": {
    "engineHealth": 62,
    "batteryHealth": 81,
    "brakeHealth": 45,
    "tyreHealth": 72,
    "oilHealth": 35,
    "currentOdometer": 48000
  }
}
```

The response contains the overall health, risk level, submitted inputs, and a
saved prediction for each monitored component with risk, severity, cost, and a
recommended action.
