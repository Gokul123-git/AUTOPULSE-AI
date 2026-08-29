// ─── Export Inspection Data to CSV ────────────────────────────────────────────
export function exportInspectionToCSV(vehicle: any, analysis?: any, readings?: any[]) {
  if (!vehicle) return;

  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `autopulse_inspection_${vehicle.registrationNumber}_${timestamp}.csv`;

  const headers = [
    'Vehicle Name',
    'Manufacturer',
    'Model',
    'Registration Number',
    'Odometer (km)',
    'Fuel Type',
    'Inspection Date',
    'Overall Health Score (%)',
    'Breakdown Risk (%)',
    'Engine Health (%)',
    'Battery Health (%)',
    'Brake Health (%)',
    'Tyre Health (%)',
    'Recorded Fuel Efficiency (km/l)',
    'Next Maintenance Date',
    'Estimated Maintenance Cost (INR)',
    'Total Recommendations Count',
  ];

  const row = [
    `"${vehicle.vehicleName || vehicle.model}"`,
    `"${vehicle.manufacturer}"`,
    `"${vehicle.model}"`,
    `"${vehicle.registrationNumber}"`,
    vehicle.currentOdometer || 0,
    `"${vehicle.fuelType || 'N/A'}"`,
    `"${readings?.[0]?.createdAt ? new Date(readings[0].createdAt).toLocaleString('en-IN') : new Date().toLocaleDateString()}"`,
    analysis?.overallHealth ?? 'N/A',
    analysis?.breakdownRisk ?? 'N/A',
    analysis?.engineHealth ?? 'N/A',
    analysis?.batteryHealth ?? 'N/A',
    analysis?.brakeHealth ?? 'N/A',
    analysis?.tyreHealth ?? 'N/A',
    analysis?.fuelEfficiencyAnalysis?.recordedKmPerL ?? 'N/A',
    `"${analysis?.nextMaintenanceDate ? new Date(analysis.nextMaintenanceDate).toLocaleDateString() : 'N/A'}"`,
    analysis?.recommendations ? analysis.recommendations.reduce((sum: number, r: any) => sum + r.estimatedCost, 0) : 0,
    analysis?.recommendations?.length || 0,
  ];

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), row.join(',')].join('\n');
  const encodedUri = encodeURI(csvContent);

  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ─── Print & Generate AI Diagnostic PDF Report ──────────────────────────────
export function printAIReport(vehicle: any, analysis?: any, reading?: any) {
  if (!vehicle || !analysis) return;

  const windowPrint = window.open('', '', 'width=900,height=900');
  if (!windowPrint) return;

  const dateStr = new Date().toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>AutoPulse AI Diagnostic Report - ${vehicle.registrationNumber}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 40px; background: #fff; }
          .header { border-bottom: 3px solid #0284c7; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
          .logo { font-size: 24px; font-weight: 800; color: #0284c7; letter-spacing: -0.5px; }
          .subtitle { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
          .badge { background: #e0f2fe; color: #0369a1; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; }
          
          .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
          .card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; background: #f8fafc; }
          .card-title { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
          .card-value { font-size: 28px; font-weight: 800; color: #0f172a; }
          
          table { width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 30px; }
          th { background: #f1f5f9; text-align: left; padding: 12px; font-size: 11px; text-transform: uppercase; color: #475569; border-bottom: 2px solid #cbd5e1; }
          td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #334155; }
          
          .status-optimal { color: #16a34a; font-weight: 700; }
          .status-warning { color: #d97706; font-weight: 700; }
          .status-critical { color: #dc2626; font-weight: 700; }
          
          .footer { border-top: 1px solid #e2e8f0; pt: 20px; font-size: 11px; color: #94a3b8; text-align: center; margin-top: 40px; }
          
          @media print {
            body { padding: 20px; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="subtitle">Official AI Vehicle Inspection Report</div>
            <div class="logo">AUTOPULSE AI PLATFORM</div>
          </div>
          <div>
            <div class="badge">CONFIDENTIAL & CERTIFIED</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 6px; text-align: right;">Generated: ${dateStr}</div>
          </div>
        </div>

        <div class="card" style="margin-bottom: 24px;">
          <div class="card-title">Vehicle Identification</div>
          <div style="font-size: 20px; font-weight: 800; color: #0f172a;">${vehicle.vehicleName || vehicle.manufacturer + ' ' + vehicle.model}</div>
          <div style="font-size: 13px; color: #475569; margin-top: 6px;">
            Registration: <strong>${vehicle.registrationNumber}</strong> &nbsp;|&nbsp; 
            Odometer: <strong>${Number(vehicle.currentOdometer).toLocaleString()} km</strong> &nbsp;|&nbsp; 
            Fuel: <strong>${vehicle.fuelType || 'Petrol'}</strong>
          </div>
        </div>

        <div class="grid">
          <div class="card">
            <div class="card-title">Vehicle Health Score</div>
            <div class="card-value" style="color: ${analysis.overallHealth >= 80 ? '#16a34a' : analysis.overallHealth >= 60 ? '#d97706' : '#dc2626'};">
              ${analysis.overallHealth}%
            </div>
            <div style="font-size: 12px; color: #64748b; margin-top: 6px;">Status: ${analysis.overallHealth >= 80 ? 'Optimal Performance' : analysis.overallHealth >= 60 ? 'Requires Service' : 'Critical Repair Needed'}</div>
          </div>

          <div class="card">
            <div class="card-title">Breakdown Risk Index</div>
            <div class="card-value" style="color: ${analysis.breakdownRisk > 40 ? '#dc2626' : analysis.breakdownRisk > 20 ? '#d97706' : '#16a34a'};">
              ${analysis.breakdownRisk}%
            </div>
            <div style="font-size: 12px; color: #64748b; margin-top: 6px;">Remaining Useful Life: ${analysis.remainingUsefulLifeDays} days</div>
          </div>
        </div>

        <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #475569; margin-bottom: 12px;">Component Diagnostic Breakdown</h3>
        <table>
          <thead>
            <tr>
              <th>System Component</th>
              <th>Health Index</th>
              <th>Status Evaluation</th>
              <th>Action Required</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Engine System</strong></td>
              <td>${analysis.engineHealth}%</td>
              <td class="${analysis.engineHealth >= 80 ? 'status-optimal' : analysis.engineHealth >= 60 ? 'status-warning' : 'status-critical'}">
                ${analysis.engineHealth >= 80 ? 'PASS' : analysis.engineHealth >= 60 ? 'ATTENTION' : 'FAIL'}
              </td>
              <td>${analysis.engineHealth < 80 ? 'Inspect oil & cooling system' : 'None'}</td>
            </tr>
            <tr>
              <td><strong>Battery & Charging</strong></td>
              <td>${analysis.batteryHealth}%</td>
              <td class="${analysis.batteryHealth >= 80 ? 'status-optimal' : analysis.batteryHealth >= 60 ? 'status-warning' : 'status-critical'}">
                ${analysis.batteryHealth >= 80 ? 'PASS' : analysis.batteryHealth >= 60 ? 'ATTENTION' : 'FAIL'}
              </td>
              <td>${analysis.batteryHealth < 80 ? 'Check voltage & cell capacity' : 'None'}</td>
            </tr>
            <tr>
              <td><strong>Braking System</strong></td>
              <td>${analysis.brakeHealth}%</td>
              <td class="${analysis.brakeHealth >= 80 ? 'status-optimal' : analysis.brakeHealth >= 60 ? 'status-warning' : 'status-critical'}">
                ${analysis.brakeHealth >= 80 ? 'PASS' : analysis.brakeHealth >= 60 ? 'ATTENTION' : 'FAIL'}
              </td>
              <td>${analysis.brakeHealth < 80 ? 'Inspect brake pad wear & fluid' : 'None'}</td>
            </tr>
            <tr>
              <td><strong>Tyre & Wheel Assembly</strong></td>
              <td>${analysis.tyreHealth}%</td>
              <td class="${analysis.tyreHealth >= 80 ? 'status-optimal' : analysis.tyreHealth >= 60 ? 'status-warning' : 'status-critical'}">
                ${analysis.tyreHealth >= 80 ? 'PASS' : analysis.tyreHealth >= 60 ? 'ATTENTION' : 'FAIL'}
              </td>
              <td>${analysis.tyreHealth < 80 ? 'Align & balance pressure' : 'None'}</td>
            </tr>
          </tbody>
        </table>

        <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #475569; margin-bottom: 12px;">AI Predictive Recommendations</h3>
        ${
          analysis.recommendations && analysis.recommendations.length > 0
            ? `
            <table>
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Priority</th>
                  <th>Root Cause Reason</th>
                  <th>Recommended Action</th>
                  <th>Est. Cost</th>
                </tr>
              </thead>
              <tbody>
                ${analysis.recommendations
                  .map(
                    (r: any) => `
                  <tr>
                    <td><strong>${r.component}</strong></td>
                    <td style="text-transform: uppercase; font-weight: 700;">${r.priority}</td>
                    <td>${r.reason}</td>
                    <td>${r.recommendation}</td>
                    <td>₹${r.estimatedCost.toLocaleString()}</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          `
            : '<p style="font-size: 13px; color: #64748b;">No immediate component repairs required.</p>'
        }

        <div class="footer">
          AutoPulse AI Platform · Certified Telematics Diagnostic Document · Page 1 of 1
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `;

  windowPrint.document.write(html);
  windowPrint.document.close();
}
