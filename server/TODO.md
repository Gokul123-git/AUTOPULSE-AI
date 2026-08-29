# AutoPulse AI Backend Fix Plan

## Auth & Session
- [ ] Confirm auth route wiring for refresh/logout (routes/auth.js and server entrypoints)
- [ ] Improve error messages consistency for invalid credentials and token failures

## Vehicle Registration
- [ ] Enforce required fields in controllers/vehicleController.js to match requirement
- [ ] Ensure “Vehicle Number (unique)” maps to `registrationNumber` (or add alias field if frontend uses a different name)
- [ ] Ensure optional Vehicle Image upload is truly optional

## Dashboard Experience
- [ ] Implement first-time user welcome dashboard payload (instead of empty widgets)
- [ ] Add per-selected-vehicle logic: all AI insights must use only selected vehicle
- [ ] Ensure dashboard returns only that user’s vehicles and prevents cross-user leakage

## Vehicle Details Page
- [ ] Add dedicated vehicle details endpoint returning required fields + current AI health score

## AI Output Constraints
- [ ] Ensure Prediction analysis and dashboard shaping never uses demo/hardcoded vehicles
- [ ] Ensure predictions/maintenance recommendations are filtered by selected vehicle

## Testing Checklist
- [ ] Register -> login -> refresh -> access protected routes
- [ ] Register vehicle with required fields -> persists
- [ ] Dashboard with 0 vehicles -> welcome payload
- [ ] Dashboard with 1+ vehicles -> only selected vehicle’s insights

