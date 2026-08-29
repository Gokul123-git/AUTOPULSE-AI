import { ChangeEvent, FormEvent, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import api from '../api';

type Field = [string, string, string?];
const groups: [string, Field[]][] = [
  ['Vehicle & service', [['lastServiceDate', 'Last service date', 'date'], ['averageDailyDistance', 'Average daily distance (km)', 'number'], ['warrantyStatus', 'Warranty status'], ['vehicleCategory', 'Vehicle category']]],
  ['Engine', [['engineTemperature', 'Engine temperature (°C)', 'number'], ['engineOilPressure', 'Oil pressure (psi)', 'number'], ['engineOilLevel', 'Oil level (normal / low)'], ['coolantTemperature', 'Coolant temperature (°C)', 'number'], ['coolantLevel', 'Coolant level (normal / low)'], ['rpm', 'RPM', 'number'], ['engineLoad', 'Engine load (%)', 'number'], ['airIntakeTemperature', 'Air intake temperature (°C)', 'number'], ['airFilterCondition', 'Air filter condition'], ['turboPressure', 'Turbo pressure (optional)', 'number'], ['checkEngineLight', 'Check engine light (on / off)']]],
  ['Battery & fuel', [['batteryVoltage', 'Battery voltage (V)', 'number'], ['batteryHealth', 'Battery health (%)', 'number'], ['chargingStatus', 'Charging status'], ['alternatorOutput', 'Alternator output (V)', 'number'], ['batteryAge', 'Battery age (months)', 'number'], ['fuelLevel', 'Fuel level (%)', 'number'], ['fuelEfficiency', 'Fuel efficiency (km/l)', 'number'], ['fuelConsumption', 'Fuel consumption (L/100 km)', 'number'], ['fuelQuality', 'Fuel quality (optional)']]],
  ['Tyres, brakes & suspension', [['frontLeftTirePressure', 'Front left pressure (psi)', 'number'], ['frontRightTirePressure', 'Front right pressure (psi)', 'number'], ['rearLeftTirePressure', 'Rear left pressure (psi)', 'number'], ['rearRightTirePressure', 'Rear right pressure (psi)', 'number'], ['tireTemperature', 'Tire temperature (°C)', 'number'], ['tireWearPercentage', 'Tire wear (%)', 'number'], ['wheelAlignmentStatus', 'Wheel alignment status'], ['brakePadWear', 'Brake pad wear (%)', 'number'], ['brakeFluidLevel', 'Brake fluid level'], ['brakeTemperature', 'Brake temperature (°C)', 'number'], ['absStatus', 'ABS status'], ['suspensionCondition', 'Suspension condition'], ['shockAbsorberCondition', 'Shock absorber condition'], ['steeringAlignment', 'Steering alignment']]],
  ['Electrical, driving & environment', [['headlightStatus', 'Headlight status'], ['sensorHealth', 'Sensor health'], ['ecuStatus', 'ECU status'], ['fuseHealth', 'Fuse health'], ['averageSpeed', 'Average speed (km/h)', 'number'], ['maximumSpeed', 'Maximum speed (km/h)', 'number'], ['harshBrakingCount', 'Harsh braking count', 'number'], ['rapidAccelerationCount', 'Rapid acceleration count', 'number'], ['hardCorneringCount', 'Hard cornering count', 'number'], ['idleTime', 'Idle time (minutes)', 'number'], ['nightDrivingHours', 'Night driving hours', 'number'], ['overspeedEvents', 'Overspeed events', 'number'], ['outsideTemperature', 'Outside temperature (°C)', 'number'], ['roadType', 'Road type'], ['trafficCondition', 'Traffic condition'], ['terrain', 'Terrain'], ['weather', 'Weather']]],
  ['Maintenance history', [['previousRepairs', 'Previous repairs'], ['serviceHistory', 'Service history'], ['partsReplaced', 'Parts replaced'], ['accidentHistory', 'Accident history'], ['insuranceClaims', 'Insurance claims (optional)']]]
];

const allFields = groups.flatMap(([, f]) => f.map(([k]) => k));
const numeric = new Set(groups.flatMap(([, f]) => f.filter(([, , t]) => t === 'number').map(([k]) => k)));
const normalise = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

const aliases: Record<string, string> = {
  enginetemperaturec: 'engineTemperature',
  oilpressure: 'engineOilPressure',
  engineoilpressurepsi: 'engineOilPressure',
  oillevel: 'engineOilLevel',
  coolant: 'coolantLevel',
  coolanttemperaturec: 'coolantTemperature',
  batteryvoltagev: 'batteryVoltage',
  batterypercentage: 'batteryHealth',
  batteryhealthpercentage: 'batteryHealth',
  alternatorvoltage: 'alternatorOutput',
  fuellevelpercentage: 'fuelLevel',
  mileage: 'fuelEfficiency',
  kmpl: 'fuelEfficiency',
  fuelaverage: 'fuelEfficiency',
  fltyrepressure: 'frontLeftTirePressure',
  frtyrepressure: 'frontRightTirePressure',
  rltyrepressure: 'rearLeftTirePressure',
  rrtyrepressure: 'rearRightTirePressure',
  tyrewear: 'tireWearPercentage',
  brakepadwearpercentage: 'brakePadWear',
  brakefluid: 'brakeFluidLevel',
  abs: 'absStatus',
  avgspeed: 'averageSpeed',
  maxspeed: 'maximumSpeed',
  harshbraking: 'harshBrakingCount',
  idleminutes: 'idleTime',
  lastservice: 'lastServiceDate'
};

const canonical = (h: string) => {
  const n = normalise(h);
  return allFields.find(k => normalise(k) === n) || aliases[n];
};

export default function AssessmentPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [values, setValues] = useState<Record<string, any>>({});
  const [message, setMessage] = useState('');
  const [missing, setMissing] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [source, setSource] = useState('manual');
  const [importInfo, setImportInfo] = useState('');

  const importFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      let row: any;
      if (file.name.toLowerCase().endsWith('.json')) {
        row = JSON.parse(await file.text());
        if (Array.isArray(row)) row = row[0] || {};
      } else {
        const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
        row = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' })[0] || {};
      }
      const mapped: Record<string, any> = {}, ignored: string[] = [];
      Object.entries(row).forEach(([h, v]) => {
        const k = canonical(h);
        if (k) mapped[k] = v;
        else ignored.push(h);
      });
      setValues(v => ({ ...v, ...mapped }));
      setSource(file.name.toLowerCase().endsWith('.json') ? 'json' : file.name.toLowerCase().endsWith('.csv') ? 'csv' : 'xlsx');
      setImportInfo(`${Object.keys(mapped).length} fields recognised${ignored.length ? `; ${ignored.length} unmatched columns skipped` : ''}.`);
      setMessage(`Imported ${file.name}; review values below before analysis.`);
    } catch {
      setMessage('Could not read that file. Please upload a valid CSV, XLSX, or JSON inspection file.');
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, numeric.has(k) && v !== '' ? Number(v) : v]));
      const r = await api.post(`/assessments/${id}`, { data, source });
      if (!r.data.ready) {
        setMissing(r.data.missingFields);
        setMessage(r.data.message);
        return;
      }
      nav(`/vehicles/${id}`);
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Could not save assessment.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#030712] px-6 py-10 text-slate-100">
      <form onSubmit={submit} className="mx-auto max-w-5xl">
        <Link to={`/vehicles/${id}`} className="text-cyan-300 hover:underline text-xs font-bold">← Back to Vehicle Profile</Link>
        <p className="mt-6 text-xs font-bold uppercase tracking-[.3em] text-cyan-400">Evidence-First AI Diagnostics</p>
        <h1 className="mt-2 text-3xl font-black">AI Vehicle Assessment</h1>
        <p className="mt-2 text-xs text-slate-400">Import a workshop inspection sheet or enter telemetry parameters manually for deep AI component health modeling.</p>

        {/* Enterprise Upload Section */}
        <section className="mt-6 rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl space-y-3 shadow-xl">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </span>
            <div>
              <h2 className="text-base font-bold text-white">Import Inspection Data</h2>
              <p className="text-xs text-slate-400">Upload CSV, Excel (.xlsx), or JSON inspection records.</p>
            </div>
          </div>

          <input
            type="file"
            accept=".json,.csv,.xlsx,.xls"
            onChange={importFile}
            className="block w-full text-xs text-slate-400 cursor-pointer file:mr-4 file:rounded-xl file:border-0 file:bg-cyan-500/10 file:px-4 file:py-2 file:text-xs file:font-bold file:text-cyan-300 hover:file:bg-cyan-500/20"
          />

          {importInfo && <p className="text-xs font-bold text-emerald-400">{importInfo}</p>}
        </section>

        {message && <p className="mt-4 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-xs font-bold text-cyan-200">{message}</p>}
        {missing.length > 0 && <p className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs font-bold text-amber-200">Still required before analysis: {missing.join(', ')}</p>}

        <div className="mt-6 space-y-5">
          {groups.map(([name, fields]) => (
            <section key={name} className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl">
              <h2 className="text-lg font-bold text-white">{name}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3 text-xs">
                {fields.map(([k, l, t]) => (
                  <label key={k} className="text-slate-300 font-medium">
                    {l}
                    <input
                      type={t || 'text'}
                      value={values[k] ?? ''}
                      onChange={e => setValues({ ...values, [k]: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 p-2.5 text-white outline-none focus:border-cyan-400"
                    />
                  </label>
                ))}
              </div>
            </section>
          ))}
        </div>

        <button
          disabled={saving}
          className="mt-6 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-8 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-400/25 disabled:opacity-60 transition-all hover:scale-105"
        >
          {saving ? 'Analyzing Telemetry Evidence…' : 'Save Assessment & Run AI Diagnostics'}
        </button>
      </form>
    </main>
  );
}
