import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import api from '../api';
import BookServiceModal from '../components/BookServiceModal';
import EditVehicleModal from '../components/EditVehicleModal';
import MaintenanceHistoryModal from '../components/MaintenanceHistoryModal';

// ─── Types ───────────────────────────────────────────────────────────────────
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
  currentOdometer: number;
  healthScore?: number;
  images?: string[];
  vin?: string;
  engineNumber?: string;
  status?: string;
  owner?: { name?: string; email?: string; phone?: string };
};

type ParsedRecord = {
  id: string;
  vehicleName: string;
  manufacturer: string;
  model: string;
  registrationNumber: string;
  vehicleType: string;
  manufacturingYear: number;
  fuelType: string;
  transmission: string;
  currentOdometer: number;
  vin?: string;
  engineNumber?: string;
  status: 'valid' | 'invalid';
  errors: string[];
};

type ServiceBooking = {
  _id: string;
  bookingId?: string;
  serviceType: string;
  scheduledDate: string;
  scheduledTime: string;
  status: string;
  contactNumber?: string;
  description?: string;
  vehicle?: { _id: string; vehicleName?: string; registrationNumber: string; manufacturer: string; model: string };
  serviceCenter?: { name: string; city?: string; phone?: string };
};

const emptyForm = {
  vehicleName: '',
  manufacturer: '',
  model: '',
  registrationNumber: '',
  vehicleType: 'Car',
  manufacturingYear: String(new Date().getFullYear()),
  fuelType: 'petrol',
  transmission: 'manual',
  vin: '',
  engineNumber: '',
  currentOdometer: '0',
};

const getVehicleDisplayName = (v: Vehicle) => v.vehicleName || `${v.manufacturer} ${v.model}`;

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 90, damping: 14 } },
};

export default function VehiclesPage() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [userBookings, setUserBookings] = useState<ServiceBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Register Modal state
  const [openRegister, setOpenRegister] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [image, setImage] = useState<File | null>(null);

  // Import Modal state
  const [openImport, setOpenImport] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedRecords, setParsedRecords] = useState<ParsedRecord[]>([]);
  const [importing, setImporting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewFilter, setPreviewFilter] = useState<'all' | 'valid' | 'invalid'>('all');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [fuelFilter, setFuelFilter] = useState('all');

  // Modal Actions state
  const [bookingVehicleId, setBookingVehicleId] = useState<string | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [historyVehicle, setHistoryVehicle] = useState<{ id: string; name: string } | null>(null);

  // Delete Confirmation state
  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load Vehicles and Service Bookings
  const loadData = async () => {
    setLoading(true);
    try {
      const [vRes, bRes] = await Promise.all([
        api.get('/vehicles'),
        api.get('/appointments').catch(() => ({ data: { appointments: [] } })),
      ]);
      setVehicles(vRes.data.vehicles || []);
      setUserBookings(bRes.data.appointments || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Unable to load fleet vehicles data.');
    } fontally: {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ─── Single Vehicle Registration Handler ──────────────────────────────────
  const handleSingleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value) payload.append(key, value);
    });
    if (image) payload.append('images', image);

    try {
      const { data } = await api.post('/vehicles', payload);
      setForm(emptyForm);
      setImage(null);
      setOpenRegister(false);
      setSuccessMsg(`Vehicle "${data.vehicle.registrationNumber}" registered successfully!`);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Unable to register vehicle.');
    }
  };

  // ─── File Upload & Parsing Handler (CSV / XLSX / JSON) ───────────────────
  const handleFileSelect = async (file: File) => {
    setImportFile(file);
    setError('');
    setUploadProgress(25);

    try {
      let json: any[] = [];
      const ext = file.name.split('.').pop()?.toLowerCase();

      setUploadProgress(50);

      if (ext === 'json') {
        const text = await file.text();
        const parsed = JSON.parse(text);
        json = Array.isArray(parsed) ? parsed : [parsed];
      } else {
        const data = new Uint8Array(await file.arrayBuffer());
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      }

      setUploadProgress(75);

      // Normalize & Validate Rows
      const processed: ParsedRecord[] = json.map((row, idx) => {
        const getVal = (keys: string[]) => {
          for (const k of keys) {
            const match = Object.keys(row).find(
              (rk) => rk.trim().toLowerCase() === k.toLowerCase()
            );
            if (match && row[match] !== undefined && row[match] !== '') return row[match];
          }
          return '';
        };

        const manufacturer = String(getVal(['manufacturer', 'brand', 'make'])).trim();
        const model = String(getVal(['model', 'vehicle model'])).trim();
        const registrationNumber = String(
          getVal(['registrationNumber', 'registration number', 'reg number', 'plate', 'vehicle number'])
        ).trim();
        const vehicleName = String(
          getVal(['vehicleName', 'name', 'vehicle name'])
        ).trim() || (manufacturer && model ? `${manufacturer} ${model}` : '');
        const fuelType = String(
          getVal(['fuelType', 'fuel type', 'fuel'])
        ).trim().toLowerCase() || 'petrol';
        const vehicleType = String(
          getVal(['vehicleType', 'type', 'category'])
        ).trim() || 'Car';
        const transmission = String(
          getVal(['transmission', 'gearbox'])
        ).trim().toLowerCase() || 'manual';
        const odoRaw = getVal(['currentOdometer', 'odometer', 'km', 'mileage']);
        const currentOdometer = Number(odoRaw) >= 0 ? Number(odoRaw) : 0;
        const yearRaw = getVal(['manufacturingYear', 'year', 'mfg year']);
        const manufacturingYear = Number(yearRaw) > 1900 ? Number(yearRaw) : new Date().getFullYear();
        const vin = String(getVal(['vin', 'chassis', 'vin number']));
        const engineNumber = String(getVal(['engineNumber', 'engine no', 'engine']));

        // Validation rules
        const errors: string[] = [];
        if (!manufacturer) errors.push('Missing Manufacturer');
        if (!model) errors.push('Missing Model');
        if (!registrationNumber) errors.push('Missing Registration Number');

        return {
          id: `row-${idx}-${Date.now()}`,
          vehicleName: vehicleName || 'Unnamed Vehicle',
          manufacturer,
          model,
          registrationNumber,
          vehicleType,
          manufacturingYear,
          fuelType,
          transmission,
          currentOdometer,
          vin,
          engineNumber,
          status: errors.length === 0 ? 'valid' : 'invalid',
          errors,
        };
      });

      setParsedRecords(processed);
      setUploadProgress(100);
    } catch (err: any) {
      setError('Failed to parse file. Please ensure it is a valid CSV, Excel spreadsheet (.xlsx), or JSON file.');
      setUploadProgress(0);
    }
  };

  // Inline Row Editor for Preview Table
  const updateParsedRecord = (id: string, field: keyof ParsedRecord, value: any) => {
    setParsedRecords((prev) =>
      prev.map((rec) => {
        if (rec.id !== id) return rec;
        const updated = { ...rec, [field]: value };
        const errs: string[] = [];
        if (!updated.manufacturer) errs.push('Missing Manufacturer');
        if (!updated.model) errs.push('Missing Model');
        if (!updated.registrationNumber) errs.push('Missing Registration Number');
        updated.errors = errs;
        updated.status = errs.length === 0 ? 'valid' : 'invalid';
        return updated;
      })
    );
  };

  // Remove Row from Preview
  const removeParsedRecord = (id: string) => {
    setParsedRecords((prev) => prev.filter((r) => r.id !== id));
  };

  // Batch Commit to MongoDB
  const commitImportToDB = async () => {
    const validRecords = parsedRecords.filter((r) => r.status === 'valid');
    if (validRecords.length === 0) {
      setError('No valid vehicle records to import. Please correct missing fields.');
      return;
    }

    setImporting(true);
    setError('');
    let successCount = 0;

    for (let i = 0; i < validRecords.length; i++) {
      const rec = validRecords[i];
      try {
        await api.post('/vehicles', {
          vehicleName: rec.vehicleName,
          manufacturer: rec.manufacturer,
          model: rec.model,
          registrationNumber: rec.registrationNumber,
          vehicleType: rec.vehicleType || 'Car',
          manufacturingYear: rec.manufacturingYear,
          fuelType: rec.fuelType,
          transmission: rec.transmission,
          currentOdometer: rec.currentOdometer,
          vin: rec.vin,
          engineNumber: rec.engineNumber,
        });
        successCount++;
      } catch (err) {
        // Skip individual error or handle
      }
      setUploadProgress(Math.round(((i + 1) / validRecords.length) * 100));
    }

    setImporting(false);
    setOpenImport(false);
    setImportFile(null);
    setParsedRecords([]);

    if (successCount > 0) {
      setSuccessMsg(`Successfully imported ${successCount} vehicle(s) into MongoDB!`);
      loadData();
    } else {
      setError(`Failed to import vehicles. Please check duplicate registration numbers.`);
    }
  };

  // Confirm Delete Vehicle
  const confirmDeleteVehicle = async () => {
    if (!deletingVehicle) return;
    setIsDeleting(true);
    setError('');

    try {
      const res = await api.delete(`/vehicles/${deletingVehicle._id}`);
      setSuccessMsg(res.data.message || `Vehicle ${deletingVehicle.registrationNumber} deleted successfully.`);
      setDeletingVehicle(null);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete vehicle.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Cancel Booking
  const handleCancelBooking = async (bookingId: string) => {
    try {
      await api.delete(`/appointments/${bookingId}`);
      setSuccessMsg('Service booking cancelled successfully.');
      loadData();
    } catch (err: any) {
      setError('Unable to cancel service booking.');
    }
  };

  // Filtered Vehicle List
  const filteredVehicles = vehicles.filter((v) => {
    const name = getVehicleDisplayName(v).toLowerCase();
    const reg = v.registrationNumber.toLowerCase();
    const matchesSearch = name.includes(searchTerm.toLowerCase()) || reg.includes(searchTerm.toLowerCase());
    const matchesFuel = fuelFilter === 'all' || v.fuelType?.toLowerCase() === fuelFilter.toLowerCase();
    return matchesSearch && matchesFuel;
  });

  const validCount = parsedRecords.filter((r) => r.status === 'valid').length;
  const invalidCount = parsedRecords.filter((r) => r.status === 'invalid').length;

  return (
    <main className="min-h-screen bg-[#030712] px-4 py-8 sm:px-6 lg:px-8 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/[0.08] bg-slate-900/60 p-6 backdrop-blur-2xl shadow-2xl">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">
              Commercial Fleet Asset Management
            </span>
            <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">
              Fleet Vehicle Registry
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Manage telemetry assets, import inspection data, book certified service, and audit component health.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Import Inspection Data Button */}
            <button
              onClick={() => setOpenImport(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20 transition-all shadow-lg shadow-cyan-500/10"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              Import Inspection Data
            </button>

            {/* Register Vehicle Button */}
            <button
              onClick={() => setOpenRegister(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-400/25 hover:scale-105 transition-all"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Register Vehicle
            </button>
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

        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-slate-900/60 p-4 backdrop-blur-xl">
          <div className="relative flex-1 min-w-[240px]">
            <svg className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              placeholder="Search by vehicle name, model, or registration plate..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950 pl-10 pr-4 py-2 text-xs font-medium text-white outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Fuel:</span>
            <select
              value={fuelFilter}
              onChange={(e) => setFuelFilter(e.target.value)}
              className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs font-medium text-white outline-none focus:border-cyan-400"
            >
              <option value="all">All Fuel Types</option>
              <option value="petrol">Petrol</option>
              <option value="diesel">Diesel</option>
              <option value="electric">Electric</option>
              <option value="cng">CNG</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
        </div>

        {/* ─────── VEHICLE CARDS GRID ─────── */}
        {loading ? (
          <div className="py-16 text-center text-xs font-bold text-cyan-400">
            Loading fleet assets…
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/20 bg-slate-900/60 p-12 text-center backdrop-blur-2xl">
            <h3 className="text-xl font-bold text-white">No Vehicles Found</h3>
            <p className="mt-2 text-xs text-slate-400">
              Register a vehicle or use "Import Inspection Data" to upload CSV, Excel, or JSON fleet files.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredVehicles.map((vehicle) => (
              <div
                key={vehicle._id}
                className="group relative overflow-hidden rounded-3xl border border-white/[0.08] bg-slate-900/60 p-5 backdrop-blur-2xl transition-all duration-300 hover:border-cyan-500/40 hover:shadow-2xl flex flex-col justify-between"
              >
                <div>
                  {/* Image Preview */}
                  <div className="relative h-44 w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-950">
                    {vehicle.images?.[0] ? (
                      <img
                        src={vehicle.images[0]}
                        alt={getVehicleDisplayName(vehicle)}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-slate-500">
                        <svg className="h-10 w-10 text-cyan-400/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute left-3 top-3 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                      {vehicle.fuelType || 'Petrol'}
                    </div>

                    <div className="absolute right-3 top-3 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/10 px-2.5 py-0.5 text-[10px] font-bold text-slate-300">
                      {vehicle.vehicleType || 'Car'}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="mt-4">
                    <h2 className="text-lg font-extrabold text-white group-hover:text-cyan-300 transition-colors">
                      {getVehicleDisplayName(vehicle)}
                    </h2>
                    <p className="mt-1 text-xs text-slate-400 font-medium">
                      Reg: <span className="font-bold text-slate-200">{vehicle.registrationNumber}</span> · {Number(vehicle.currentOdometer).toLocaleString()} km
                    </p>
                  </div>
                </div>

                {/* Health Score & Action Buttons Bar */}
                <div className="mt-4 border-t border-white/[0.06] pt-3 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Health Index:</span>
                    <span className="font-bold text-emerald-400">
                      {vehicle.healthScore ? `${vehicle.healthScore}%` : 'Assessment Needed'}
                    </span>
                  </div>

                  {/* Action Buttons Matrix */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1 text-[11px] font-bold">
                    {/* 1. View Details */}
                    <button
                      onClick={() => navigate(`/vehicles/${vehicle._id}`)}
                      className="rounded-lg border border-white/10 bg-slate-950 py-1.5 text-center text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
                    >
                      Details
                    </button>

                    {/* 2. Edit Vehicle */}
                    <button
                      onClick={() => setEditingVehicle(vehicle)}
                      className="rounded-lg border border-white/10 bg-slate-950 py-1.5 text-center text-cyan-300 hover:bg-cyan-500/20 transition-all"
                    >
                      Edit
                    </button>

                    {/* 3. View AI Analysis */}
                    <button
                      onClick={() => navigate(`/vehicles/${vehicle._id}`)}
                      className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 py-1.5 text-center text-cyan-300 hover:bg-cyan-500/20 transition-all"
                    >
                      AI Report
                    </button>

                    {/* 4. Book Service */}
                    <button
                      onClick={() => setBookingVehicleId(vehicle._id)}
                      className="col-span-2 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 py-1.5 text-center text-slate-950 hover:scale-[1.02] transition-all shadow-md shadow-cyan-400/20"
                    >
                      Book Service
                    </button>

                    {/* 5. Delete Vehicle */}
                    <button
                      onClick={() => setDeletingVehicle(vehicle)}
                      className="rounded-lg border border-red-500/30 bg-red-950/30 py-1.5 text-center text-red-400 hover:bg-red-900/50 hover:text-white transition-all"
                    >
                      Delete
                    </button>

                    {/* 6. Maintenance History */}
                    <button
                      onClick={() => setHistoryVehicle({ id: vehicle._id, name: getVehicleDisplayName(vehicle) })}
                      className="col-span-3 rounded-lg border border-white/10 bg-slate-950/80 py-1.5 text-center text-slate-400 hover:text-slate-200 transition-all text-[10px]"
                    >
                      📜 View Maintenance History
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─────── SECTION: MY SERVICE BOOKINGS ─────── */}
        <section className="rounded-3xl border border-white/[0.08] bg-slate-900/60 p-6 backdrop-blur-2xl space-y-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
                </svg>
              </span>
              <div>
                <h2 className="text-lg font-extrabold text-white">My Service Bookings</h2>
                <p className="text-xs text-slate-400">Scheduled maintenance appointments & history</p>
              </div>
            </div>
            <span className="rounded-full bg-slate-800 border border-white/10 px-3 py-1 text-xs font-bold text-cyan-300">
              Total Bookings: {userBookings.length}
            </span>
          </div>

          {userBookings.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500 italic">
              No service bookings created yet. Click "Book Service" on any registered vehicle above.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {userBookings.map((b) => (
                <div
                  key={b._id}
                  className="rounded-2xl border border-white/10 bg-slate-950 p-4 space-y-2 text-xs relative group hover:border-cyan-500/40 transition-all"
                >
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="font-mono font-bold text-cyan-400">{b.bookingId || 'AP-SERVICE'}</span>
                    <span className="rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-2 py-0.5 text-[10px] font-bold uppercase">
                      {b.status}
                    </span>
                  </div>

                  <p className="font-bold text-white">
                    {b.vehicle?.vehicleName || `${b.vehicle?.manufacturer || ''} ${b.vehicle?.model || ''}`} ({b.vehicle?.registrationNumber})
                  </p>

                  <p className="text-slate-400">
                    Center: <span className="font-semibold text-slate-200">{b.serviceCenter?.name || 'Authorized Hub'}</span>
                  </p>

                  <p className="text-slate-400">
                    Type: <span className="font-bold text-emerald-400 uppercase">{b.serviceType}</span>
                  </p>

                  <div className="flex justify-between text-[11px] text-slate-300 pt-1">
                    <span>📅 {new Date(b.scheduledDate).toLocaleDateString()}</span>
                    <span>⏰ {b.scheduledTime}</span>
                  </div>

                  <button
                    onClick={() => handleCancelBooking(b._id)}
                    className="mt-2 w-full rounded-xl border border-red-500/30 bg-red-950/20 py-1.5 text-center text-[10px] font-bold text-red-400 hover:bg-red-900/40 hover:text-white transition-all"
                  >
                    Cancel Booking
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ─────── MODAL 1: ENTERPRISE IMPORT INSPECTION DATA ─────── */}
        <AnimatePresence>
          {openImport && (
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
                className="w-full max-w-4xl rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl space-y-5 my-8"
              >
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">Import Inspection Data</h2>
                    <p className="text-xs text-slate-400">
                      Upload fleet spreadsheet records or JSON files to batch register fleet assets.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setOpenImport(false);
                      setParsedRecords([]);
                      setImportFile(null);
                    }}
                    className="text-slate-400 hover:text-white font-bold"
                  >
                    ✕
                  </button>
                </div>

                {/* Upload Zone */}
                {!importFile ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-cyan-500/30 bg-slate-950/60 p-10 text-center hover:border-cyan-400 transition-colors">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-3">
                      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    </div>
                    <p className="text-sm font-bold text-white">Drag & drop your inspection file here</p>
                    <p className="text-xs text-slate-400 mt-1">Supported formats: CSV, Excel (.xlsx), JSON</p>
                    <input
                      type="file"
                      accept=".csv, .xlsx, .xls, .json"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
                      }}
                      className="mt-4 block text-xs text-slate-400 cursor-pointer file:mr-4 file:rounded-xl file:border-0 file:bg-cyan-500/10 file:px-4 file:py-2 file:text-xs file:font-bold file:text-cyan-300 hover:file:bg-cyan-500/20"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Upload Progress Bar */}
                    <div className="rounded-2xl bg-slate-950 p-4 border border-white/5 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white">File: {importFile.name}</span>
                        <span className="text-cyan-400 font-bold">{uploadProgress}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                        <motion.div
                          className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>

                    {/* Preview Summary Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-slate-800 px-3 py-1 font-bold text-slate-200">
                          Total Rows: {parsedRecords.length}
                        </span>
                        <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 font-bold">
                          Valid: {validCount}
                        </span>
                        {invalidCount > 0 && (
                          <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 font-bold">
                            Needs Correction: {invalidCount}
                          </span>
                        )}
                      </div>

                      {/* Preview Filters */}
                      <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-white/10">
                        <button
                          onClick={() => setPreviewFilter('all')}
                          className={`rounded-lg px-2.5 py-0.5 text-[10px] font-bold ${previewFilter === 'all' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'}`}
                        >
                          All ({parsedRecords.length})
                        </button>
                        <button
                          onClick={() => setPreviewFilter('valid')}
                          className={`rounded-lg px-2.5 py-0.5 text-[10px] font-bold ${previewFilter === 'valid' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400'}`}
                        >
                          Valid ({validCount})
                        </button>
                        <button
                          onClick={() => setPreviewFilter('invalid')}
                          className={`rounded-lg px-2.5 py-0.5 text-[10px] font-bold ${previewFilter === 'invalid' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400'}`}
                        >
                          Invalid ({invalidCount})
                        </button>
                      </div>
                    </div>

                    {/* Preview Table */}
                    <div className="max-h-72 overflow-x-auto overflow-y-auto rounded-2xl border border-white/10 bg-slate-950">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-900 text-[10px] font-bold uppercase tracking-wider text-slate-400 sticky top-0">
                          <tr>
                            <th className="p-3">Status</th>
                            <th className="p-3">Manufacturer</th>
                            <th className="p-3">Model</th>
                            <th className="p-3">Registration Plate</th>
                            <th className="p-3">Odometer (km)</th>
                            <th className="p-3">Fuel Type</th>
                            <th className="p-3">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {parsedRecords
                            .filter((rec) => {
                              if (previewFilter === 'valid') return rec.status === 'valid';
                              if (previewFilter === 'invalid') return rec.status === 'invalid';
                              return true;
                            })
                            .map((rec) => (
                              <tr key={rec.id} className={rec.status === 'invalid' ? 'bg-amber-950/20' : ''}>
                                <td className="p-3">
                                  {rec.status === 'valid' ? (
                                    <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold">
                                      Valid
                                    </span>
                                  ) : (
                                    <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold">
                                      Needs Correction
                                    </span>
                                  )}
                                </td>
                                <td className="p-3">
                                  <input
                                    value={rec.manufacturer}
                                    onChange={(e) => updateParsedRecord(rec.id, 'manufacturer', e.target.value)}
                                    className="bg-transparent border-b border-white/10 outline-none focus:border-cyan-400 text-white"
                                  />
                                </td>
                                <td className="p-3">
                                  <input
                                    value={rec.model}
                                    onChange={(e) => updateParsedRecord(rec.id, 'model', e.target.value)}
                                    className="bg-transparent border-b border-white/10 outline-none focus:border-cyan-400 text-white"
                                  />
                                </td>
                                <td className="p-3">
                                  <input
                                    value={rec.registrationNumber}
                                    onChange={(e) => updateParsedRecord(rec.id, 'registrationNumber', e.target.value)}
                                    className="bg-transparent border-b border-white/10 outline-none focus:border-cyan-400 text-white font-mono"
                                  />
                                </td>
                                <td className="p-3">
                                  <input
                                    type="number"
                                    value={rec.currentOdometer}
                                    onChange={(e) => updateParsedRecord(rec.id, 'currentOdometer', Number(e.target.value))}
                                    className="w-20 bg-transparent border-b border-white/10 outline-none focus:border-cyan-400 text-white"
                                  />
                                </td>
                                <td className="p-3">
                                  <select
                                    value={rec.fuelType}
                                    onChange={(e) => updateParsedRecord(rec.id, 'fuelType', e.target.value)}
                                    className="bg-slate-900 border border-white/10 rounded px-1 py-0.5 text-white"
                                  >
                                    <option value="petrol">petrol</option>
                                    <option value="diesel">diesel</option>
                                    <option value="electric">electric</option>
                                    <option value="cng">cng</option>
                                    <option value="hybrid">hybrid</option>
                                  </select>
                                </td>
                                <td className="p-3">
                                  <button
                                    onClick={() => removeParsedRecord(rec.id)}
                                    className="text-red-400 hover:text-red-300 font-bold"
                                  >
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Commit Action Buttons */}
                    <div className="flex items-center justify-between pt-2">
                      <button
                        onClick={() => {
                          setImportFile(null);
                          setParsedRecords([]);
                        }}
                        className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                      >
                        Re-upload File
                      </button>

                      <button
                        onClick={commitImportToDB}
                        disabled={importing || validCount === 0}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-400/20 hover:scale-105 transition-all disabled:opacity-50"
                      >
                        {importing ? 'Saving Records…' : `Confirm & Save (${validCount}) Vehicles`}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─────── MODAL 2: SINGLE VEHICLE REGISTER ─────── */}
        <AnimatePresence>
          {openRegister && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md overflow-y-auto"
            >
              <motion.form
                onSubmit={handleSingleSubmit}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl space-y-4 my-8"
              >
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                  <h2 className="text-xl font-bold text-white">Register Fleet Vehicle</h2>
                  <button
                    type="button"
                    onClick={() => setOpenRegister(false)}
                    className="text-slate-400 hover:text-white font-bold"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 text-xs">
                  <div>
                    <label className="block font-bold text-slate-300">Vehicle Name</label>
                    <input
                      required
                      value={form.vehicleName}
                      onChange={(e) => setForm({ ...form, vehicleName: e.target.value })}
                      placeholder="e.g. Executive Sedan 01"
                      className="input mt-1 w-full rounded-xl border border-white/10 bg-slate-950 p-2.5 text-white outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300">Manufacturer / Brand</label>
                    <input
                      required
                      value={form.manufacturer}
                      onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
                      placeholder="e.g. Tata Motors"
                      className="input mt-1 w-full rounded-xl border border-white/10 bg-slate-950 p-2.5 text-white outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300">Vehicle Model</label>
                    <input
                      required
                      value={form.model}
                      onChange={(e) => setForm({ ...form, model: e.target.value })}
                      placeholder="e.g. Nexon EV"
                      className="input mt-1 w-full rounded-xl border border-white/10 bg-slate-950 p-2.5 text-white outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300">Registration Number</label>
                    <input
                      required
                      value={form.registrationNumber}
                      onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
                      placeholder="e.g. KA01MH1234"
                      className="input mt-1 uppercase w-full rounded-xl border border-white/10 bg-slate-950 p-2.5 text-white outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300">Fuel Type</label>
                    <select
                      value={form.fuelType}
                      onChange={(e) => setForm({ ...form, fuelType: e.target.value })}
                      className="input mt-1 w-full rounded-xl border border-white/10 bg-slate-950 p-2.5 text-white outline-none focus:border-cyan-400"
                    >
                      <option value="petrol">Petrol</option>
                      <option value="diesel">Diesel</option>
                      <option value="electric">Electric</option>
                      <option value="cng">CNG</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300">Current Odometer (km)</label>
                    <input
                      required
                      type="number"
                      value={form.currentOdometer}
                      onChange={(e) => setForm({ ...form, currentOdometer: e.target.value })}
                      className="input mt-1 w-full rounded-xl border border-white/10 bg-slate-950 p-2.5 text-white outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setOpenRegister(false)}
                    className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-400/20"
                  >
                    Save Vehicle
                  </button>
                </div>
              </motion.form>
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
                    Target Asset: <span className="font-bold text-white">{deletingVehicle.registrationNumber}</span> ({getVehicleDisplayName(deletingVehicle)})
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

        {/* Modal components */}
        <BookServiceModal
          isOpen={Boolean(bookingVehicleId)}
          onClose={() => setBookingVehicleId(null)}
          vehicles={vehicles}
          preselectedVehicleId={bookingVehicleId || undefined}
          onSuccess={loadData}
        />

        <EditVehicleModal
          isOpen={Boolean(editingVehicle)}
          onClose={() => setEditingVehicle(null)}
          vehicle={editingVehicle}
          onSuccess={loadData}
        />

        <MaintenanceHistoryModal
          isOpen={Boolean(historyVehicle)}
          onClose={() => setHistoryVehicle(null)}
          vehicleId={historyVehicle?.id || ''}
          vehicleName={historyVehicle?.name || ''}
        />
      </div>
    </main>
  );
}
