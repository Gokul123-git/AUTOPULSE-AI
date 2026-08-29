import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';

type Owner = {
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
};

type Vehicle = {
  _id: string;
  vehicleName?: string;
  manufacturer: string;
  model: string;
  registrationNumber: string;
  vehicleType?: string;
  manufacturingYear?: number;
  fuelType?: string;
  transmission?: string;
  currentOdometer?: number;
  healthScore?: number;
  status?: string;
  isActive?: boolean;
  createdAt?: string;
  owner?: Owner;
};

export default function AdminPage() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search, Filter, Sort state
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'health'>('newest');

  // Modals state
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);
  const [inspectionVehicle, setInspectionVehicle] = useState<Vehicle | null>(null);
  const [inspectionsList, setInspectionsList] = useState<any[]>([]);
  const [loadingInspections, setLoadingInspections] = useState(false);

  // Deletion state
  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load All Vehicles
  const loadVehicles = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/vehicles');
      setVehicles(data.vehicles || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Unable to load fleet vehicles for admin view.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  // Toggle Vehicle Active Status directly in MongoDB
  const toggleVehicleActive = async (v: Vehicle) => {
    const nextStatus = v.status === 'idle' || v.isActive === false ? 'active' : 'idle';
    const nextActive = !v.isActive;

    try {
      await api.put(`/vehicles/${v._id}`, { status: nextStatus, isActive: nextActive });
      setSuccessMsg(`Updated status for ${v.registrationNumber}.`);
      loadVehicles();
    } catch (err: any) {
      setError('Failed to update vehicle status.');
    }
  };

  // View Inspection History for Admin
  const handleViewInspections = async (v: Vehicle) => {
    setInspectionVehicle(v);
    setLoadingInspections(true);
    try {
      const { data } = await api.get(`/health-readings?vehicleId=${v._id}`);
      setInspectionsList(data.readings || []);
    } catch (err) {
      setInspectionsList([]);
    } finally {
      setLoadingInspections(false);
    }
  };

  // Confirm Delete Vehicle
  const confirmDeleteVehicle = async () => {
    if (!deletingVehicle) return;
    setIsDeleting(true);
    setError('');

    try {
      const res = await api.delete(`/vehicles/${deletingVehicle._id}`);
      setSuccessMsg(res.data.message || `Vehicle ${deletingVehicle.registrationNumber} deleted.`);
      setDeletingVehicle(null);
      loadVehicles();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete vehicle.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Compute Dashboard Statistics
  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter((v) => v.isActive !== false && v.status !== 'idle' && v.status !== 'sold').length;
  const needingMaintenance = vehicles.filter((v) => (v.healthScore !== undefined && v.healthScore < 70) || v.status === 'in_service').length;
  const criticalAlerts = vehicles.filter((v) => v.healthScore !== undefined && v.healthScore < 50).length;

  // Filter & Sort Logic
  const filteredVehicles = vehicles
    .filter((v) => {
      const reg = (v.registrationNumber || '').toLowerCase();
      const ownerName = (v.owner?.name || '').toLowerCase();
      const brand = (v.manufacturer || '').toLowerCase();
      const model = (v.model || '').toLowerCase();
      const vName = (v.vehicleName || '').toLowerCase();

      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        reg.includes(searchLower) ||
        ownerName.includes(searchLower) ||
        brand.includes(searchLower) ||
        model.includes(searchLower) ||
        vName.includes(searchLower);

      const matchesType =
        typeFilter === 'all' || (v.vehicleType || '').toLowerCase() === typeFilter.toLowerCase();

      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      if (sortBy === 'oldest') return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      if (sortBy === 'health') return (a.healthScore || 0) - (b.healthScore || 0);
      return 0;
    });

  return (
    <main className="min-h-screen bg-[#030712] px-4 py-8 sm:px-6 lg:px-8 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/[0.08] bg-slate-900/60 p-6 backdrop-blur-2xl shadow-2xl">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">
              System Administration Portal
            </span>
            <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">
              Admin Vehicle Management
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Cross-tenant asset oversight, fleet status management, owner audits, and cascading deletion control.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-bold text-cyan-300">
              Role: Administrator
            </span>
          </div>
        </div>

        {/* Notifications */}
        {successMsg && (
          <div className="flex items-center justify-between rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-xs font-bold text-emerald-300">
            <span>✓ {successMsg}</span>
            <button onClick={() => setSuccessMsg('')} className="text-emerald-400 hover:text-white font-bold">✕</button>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-between rounded-2xl bg-red-950/40 border border-red-500/30 p-4 text-xs text-red-200">
            <span>⚠ {error}</span>
            <button onClick={() => setError('')} className="text-red-400 hover:text-white font-bold">✕</button>
          </div>
        )}

        {/* ─────── KPI STATS DASHBOARD ─────── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Stat 1: Total Registered */}
          <div className="rounded-3xl border border-white/[0.08] bg-slate-900/60 p-5 backdrop-blur-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Registered</p>
              <h3 className="mt-1 text-3xl font-black text-white">{totalVehicles}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Across all fleet accounts</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
            </div>
          </div>

          {/* Stat 2: Active Vehicles */}
          <div className="rounded-3xl border border-white/[0.08] bg-slate-900/60 p-5 backdrop-blur-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Assets</p>
              <h3 className="mt-1 text-3xl font-black text-emerald-400">{activeVehicles}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Operational on telemetry</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          {/* Stat 3: Needing Maintenance */}
          <div className="rounded-3xl border border-white/[0.08] bg-slate-900/60 p-5 backdrop-blur-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Needs Maintenance</p>
              <h3 className="mt-1 text-3xl font-black text-amber-400">{needingMaintenance}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Health score &lt; 70%</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l5.654-4.654" />
              </svg>
            </div>
          </div>

          {/* Stat 4: Critical Alerts */}
          <div className="rounded-3xl border border-white/[0.08] bg-slate-900/60 p-5 backdrop-blur-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Critical Alerts</p>
              <h3 className="mt-1 text-3xl font-black text-red-400">{criticalAlerts}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Breakdown risk detected</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-slate-900/60 p-4 backdrop-blur-xl">
          <div className="relative flex-1 min-w-[280px]">
            <svg className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              placeholder="Search by vehicle number, owner name, brand, or model..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950 pl-10 pr-4 py-2 text-xs font-medium text-white outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filter by Type */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Type:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs font-medium text-white outline-none focus:border-cyan-400"
              >
                <option value="all">All Types</option>
                <option value="Car">Car</option>
                <option value="SUV">SUV</option>
                <option value="Truck">Truck</option>
                <option value="Bus">Bus</option>
                <option value="Van">Van</option>
                <option value="Two-Wheeler">Two-Wheeler</option>
                <option value="Heavy Duty">Heavy Duty</option>
              </select>
            </div>

            {/* Sort By Registration Date */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs font-medium text-white outline-none focus:border-cyan-400"
              >
                <option value="newest">Newest Registration</option>
                <option value="oldest">Oldest Registration</option>
                <option value="health">Lowest Health Score</option>
              </select>
            </div>
          </div>
        </div>

        {/* ─────── VEHICLES MANAGEMENT TABLE ─────── */}
        {loading ? (
          <div className="py-16 text-center text-xs font-bold text-cyan-400">
            Loading admin fleet inventory...
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/20 bg-slate-900/60 p-12 text-center backdrop-blur-2xl">
            <h3 className="text-xl font-bold text-white">No Vehicles Matched</h3>
            <p className="mt-2 text-xs text-slate-400">Try adjusting your search criteria or type filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-white/[0.08] bg-slate-900/60 backdrop-blur-2xl shadow-2xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10">
                <tr>
                  <th className="p-4">Vehicle Details</th>
                  <th className="p-4">Type & Fuel</th>
                  <th className="p-4">Owner Info</th>
                  <th className="p-4">Odometer</th>
                  <th className="p-4">Health Index</th>
                  <th className="p-4">Enable / Disable</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredVehicles.map((v) => (
                  <tr key={v._id} className="hover:bg-slate-900/80 transition-colors">
                    {/* Vehicle Details */}
                    <td className="p-4">
                      <div className="font-bold text-white text-sm">
                        {v.vehicleName || `${v.manufacturer} ${v.model}`}
                      </div>
                      <div className="font-mono text-cyan-400 font-bold text-[11px] mt-0.5">
                        {v.registrationNumber}
                      </div>
                    </td>

                    {/* Type & Fuel */}
                    <td className="p-4">
                      <span className="rounded-full bg-slate-800 border border-white/10 px-2.5 py-0.5 text-[10px] font-bold text-slate-200">
                        {v.vehicleType || 'Car'}
                      </span>
                      <span className="ml-1.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-2 py-0.5 text-[10px] font-bold uppercase">
                        {v.fuelType || 'petrol'}
                      </span>
                    </td>

                    {/* Owner Info */}
                    <td className="p-4">
                      <button
                        onClick={() => setSelectedOwner(v.owner || { name: 'Owner Account' })}
                        className="text-cyan-300 hover:underline font-bold text-left"
                      >
                        {v.owner?.name || 'Assigned Owner'}
                      </button>
                      <div className="text-[10px] text-slate-400">{v.owner?.email || 'Registered User'}</div>
                    </td>

                    {/* Odometer */}
                    <td className="p-4 font-mono font-bold text-slate-200">
                      {Number(v.currentOdometer || 0).toLocaleString()} km
                    </td>

                    {/* Health Index */}
                    <td className="p-4 font-bold">
                      {v.healthScore !== undefined ? (
                        <span className={v.healthScore >= 80 ? 'text-emerald-400' : v.healthScore >= 60 ? 'text-amber-400' : 'text-red-400'}>
                          {v.healthScore}%
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">No Assessment</span>
                      )}
                    </td>

                    {/* Enable / Disable Toggle Switch */}
                    <td className="p-4">
                      <button
                        onClick={() => toggleVehicleActive(v)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${v.status !== 'idle' && v.isActive !== false ? 'bg-cyan-500' : 'bg-slate-700'}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${v.status !== 'idle' && v.isActive !== false ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                      </button>
                      <span className="ml-2 text-[10px] font-bold text-slate-400 uppercase">
                        {v.status !== 'idle' && v.isActive !== false ? 'Active' : 'Disabled'}
                      </span>
                    </td>

                    {/* Actions Menu */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View AI Reports */}
                        <button
                          onClick={() => navigate(`/vehicles/${v._id}`)}
                          className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-bold text-cyan-300 hover:bg-cyan-500/20"
                        >
                          AI Report
                        </button>

                        {/* View Inspection History */}
                        <button
                          onClick={() => handleViewInspections(v)}
                          className="rounded-lg border border-white/10 bg-slate-950 px-2.5 py-1 text-[10px] font-bold text-slate-300 hover:bg-slate-800"
                        >
                          Inspections
                        </button>

                        {/* Delete Vehicle */}
                        <button
                          onClick={() => setDeletingVehicle(v)}
                          className="rounded-lg border border-red-500/30 bg-red-950/30 px-2.5 py-1 text-[10px] font-bold text-red-400 hover:bg-red-900/50 hover:text-white"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ─────── MODAL 1: OWNER DETAILS MODAL ─────── */}
        <AnimatePresence>
          {selectedOwner && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl space-y-4"
              >
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                  <h3 className="text-lg font-bold text-white">Vehicle Owner Account</h3>
                  <button onClick={() => setSelectedOwner(null)} className="text-slate-400 hover:text-white font-bold">✕</button>
                </div>

                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-400">Full Name:</span>
                    <span className="font-bold text-white">{selectedOwner.name || 'Registered User'}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-400">Email Address:</span>
                    <span className="font-mono text-cyan-300">{selectedOwner.email || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-400">Contact Number:</span>
                    <span className="font-bold text-slate-200">{selectedOwner.phone || 'Not Provided'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Role:</span>
                    <span className="font-bold text-emerald-400 uppercase">{selectedOwner.role || 'Fleet Operator'}</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedOwner(null)}
                  className="w-full rounded-xl bg-slate-800 py-2 text-xs font-bold text-slate-300 hover:text-white"
                >
                  Close
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─────── MODAL 2: INSPECTION HISTORY MODAL ─────── */}
        <AnimatePresence>
          {inspectionVehicle && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md overflow-y-auto"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl space-y-4 my-8"
              >
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-white">Inspection History Log</h3>
                    <p className="text-xs text-slate-400">{inspectionVehicle.registrationNumber}</p>
                  </div>
                  <button onClick={() => setInspectionVehicle(null)} className="text-slate-400 hover:text-white font-bold">✕</button>
                </div>

                {loadingInspections ? (
                  <div className="py-8 text-center text-xs font-bold text-cyan-400">Loading inspection records...</div>
                ) : inspectionsList.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-500 italic">No inspection readings recorded for this asset.</p>
                ) : (
                  <div className="space-y-3 max-h-72 overflow-y-auto">
                    {inspectionsList.map((reading) => (
                      <div key={reading._id} className="rounded-2xl border border-white/5 bg-slate-950 p-4 text-xs space-y-2">
                        <div className="flex justify-between border-b border-white/5 pb-1">
                          <span className="font-bold text-cyan-300">
                            Recorded: {new Date(reading.recordedAt || reading.createdAt).toLocaleString()}
                          </span>
                          <span className="font-mono text-slate-400">{reading.currentOdometer} km</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-[11px]">
                          <div>Engine Temp: <span className="font-bold text-white">{reading.engineTemperature}°C</span></div>
                          <div>Battery: <span className="font-bold text-white">{reading.batteryVoltage}V ({reading.batteryHealth}%)</span></div>
                          <div>Brake Condition: <span className="font-bold text-white">{reading.brakeCondition}%</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => setInspectionVehicle(null)}
                  className="w-full rounded-xl bg-slate-800 py-2 text-xs font-bold text-slate-300 hover:text-white"
                >
                  Close
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─────── MODAL 3: DELETE CONFIRMATION DIALOG ─────── */}
        <AnimatePresence>
          {deletingVehicle && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-md rounded-3xl border border-red-500/30 bg-slate-900 p-6 shadow-2xl space-y-4"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20">
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>

                <div className="text-center space-y-2">
                  <h3 className="text-xl font-extrabold text-white">Delete Fleet Vehicle</h3>
                  <p className="text-xs text-red-200/90 leading-relaxed font-semibold">
                    "Are you sure you want to permanently delete this vehicle and all associated inspection records?"
                  </p>
                  <p className="text-[11px] text-slate-400 pt-1">
                    Target Asset: <span className="font-bold text-white">{deletingVehicle.registrationNumber}</span> ({deletingVehicle.manufacturer} {deletingVehicle.model})
                  </p>
                </div>

                <div className="flex justify-center gap-3 pt-3 border-t border-white/[0.08]">
                  <button
                    onClick={() => setDeletingVehicle(null)}
                    disabled={isDeleting}
                    className="rounded-xl border border-white/10 px-5 py-2 text-xs font-bold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteVehicle}
                    disabled={isDeleting}
                    className="rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-6 py-2 text-xs font-bold text-white shadow-lg shadow-red-500/20 disabled:opacity-50"
                  >
                    {isDeleting ? 'Deleting...' : 'Permanently Delete'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
