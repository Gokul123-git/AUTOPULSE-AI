import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../api';
import AnalyticsSection from '../components/AnalyticsSection';
import { exportInspectionToCSV, printAIReport } from '../utils/reportExporter';

type Vehicle = {
  _id: string;
  vehicleName?: string;
  manufacturer: string;
  model: string;
  registrationNumber: string;
  currentOdometer: number;
  fuelType?: string;
};

export default function AnalyticsPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [reading, setReading] = useState<any>();
  const [readingsHistory, setReadingsHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/vehicles')
      .then(({ data }) => {
        const list: Vehicle[] = data.vehicles || [];
        setVehicles(list);
        if (list.length > 0) setSelectedId(list[0]._id);
      })
      .catch((e) => setError(e.response?.data?.error || 'Unable to load fleet vehicles.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    api
      .get(`/health-readings?vehicleId=${selectedId}`)
      .then((r) => {
        const list = r.data.readings || [];
        setReadingsHistory(list);
        setReading(list[0]);
      })
      .catch(() => {});
  }, [selectedId]);

  const selectedVehicle = vehicles.find((v) => v._id === selectedId) || vehicles[0];
  const analysis = reading?.analysis;

  if (loading) {
    return (
      <div className="flex min-h-[85vh] items-center justify-center text-cyan-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
          <p className="text-sm font-semibold">Loading Telemetry Analytics Dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#030712] px-4 py-8 sm:px-6 lg:px-8 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header Bar with Export Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/[0.08] bg-slate-900/60 p-6 backdrop-blur-2xl shadow-2xl">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">
              MongoDB Telemetry & Recharts Engine
            </span>
            <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">
              Advanced Vehicle Telemetry Analytics
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Comparative sub-system health analytics, failure radar, and certified report generator.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Vehicle Switcher */}
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="appearance-none rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 pr-10 text-sm font-medium text-white backdrop-blur-xl focus:border-cyan-400 focus:outline-none"
            >
              {vehicles.map((v) => (
                <option key={v._id} value={v._id} className="bg-slate-900">
                  {v.vehicleName || `${v.manufacturer} ${v.model}`} — {v.registrationNumber}
                </option>
              ))}
            </select>

            {/* Export CSV Button */}
            <button
              onClick={() => exportInspectionToCSV(selectedVehicle, analysis, readingsHistory)}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800 border border-white/10 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-all"
            >
              <svg className="h-4 w-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Export CSV Data
            </button>

            {/* Download PDF Button */}
            <button
              onClick={() => printAIReport(selectedVehicle, analysis, reading)}
              disabled={!analysis}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-400/20 hover:scale-105 transition-all disabled:opacity-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231a1.125 1.125 0 01-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.085 48.085 0 00-3.313-.336M6 18H4.909A2.25 2.25 0 012.25 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.084 48.084 0 013.313-.336m0 0a48.467 48.467 0 0110.56 0m-10.56 0V6a2.25 2.25 0 012.25-2.25h5.25A2.25 2.25 0 0116.5 6v1.456" />
              </svg>
              Download PDF Report
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl bg-red-950/40 border border-red-500/30 p-4 text-xs text-red-200">
            {error}
          </div>
        )}

        {/* Analytics Recharts Section */}
        {analysis ? (
          <AnalyticsSection
            analysis={analysis}
            readingsHistory={readingsHistory}
            vehicleName={selectedVehicle?.vehicleName || `${selectedVehicle?.manufacturer} ${selectedVehicle?.model}`}
          />
        ) : (
          <div className="rounded-3xl border border-amber-400/30 bg-slate-900/60 p-10 text-center backdrop-blur-2xl">
            <h2 className="text-xl font-bold text-white">No Inspection Analytics Available</h2>
            <p className="text-xs text-slate-400 mt-2">
              Run an inspection for this vehicle to generate Recharts radar, trend line, and component bar graphs.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
