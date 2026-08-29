import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';

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
  vin?: string;
  engineNumber?: string;
  status?: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
  onSuccess: () => void;
};

export default function EditVehicleModal({ isOpen, onClose, vehicle, onSuccess }: Props) {
  const [form, setForm] = useState({
    vehicleName: '',
    manufacturer: '',
    model: '',
    registrationNumber: '',
    vehicleType: 'Car',
    manufacturingYear: String(new Date().getFullYear()),
    fuelType: 'petrol',
    transmission: 'manual',
    currentOdometer: '0',
    vin: '',
    engineNumber: '',
    status: 'active',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (vehicle) {
      setForm({
        vehicleName: vehicle.vehicleName || '',
        manufacturer: vehicle.manufacturer || '',
        model: vehicle.model || '',
        registrationNumber: vehicle.registrationNumber || '',
        vehicleType: vehicle.vehicleType || 'Car',
        manufacturingYear: String(vehicle.manufacturingYear || new Date().getFullYear()),
        fuelType: vehicle.fuelType || 'petrol',
        transmission: vehicle.transmission || 'manual',
        currentOdometer: String(vehicle.currentOdometer || 0),
        vin: vehicle.vin || '',
        engineNumber: vehicle.engineNumber || '',
        status: vehicle.status || 'active',
      });
    }
  }, [vehicle]);

  if (!isOpen || !vehicle) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      await api.put(`/vehicles/${vehicle._id}`, form);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Unable to update vehicle profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md overflow-y-auto"
      >
        <motion.form
          onSubmit={handleSubmit}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl space-y-4 my-8"
        >
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div>
              <h2 className="text-xl font-bold text-white">Edit Vehicle Specifications</h2>
              <p className="text-xs text-slate-400">Update configuration for {vehicle.registrationNumber}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white font-bold"
            >
              ✕
            </button>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-200">
              ⚠ {error}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2 text-xs">
            <div>
              <label className="block font-bold text-slate-300">Vehicle Name</label>
              <input
                required
                value={form.vehicleName}
                onChange={(e) => setForm({ ...form, vehicleName: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-slate-950 p-2.5 text-white outline-none focus:border-cyan-400 mt-1"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300">Manufacturer</label>
              <input
                required
                value={form.manufacturer}
                onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-slate-950 p-2.5 text-white outline-none focus:border-cyan-400 mt-1"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300">Model</label>
              <input
                required
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-slate-950 p-2.5 text-white outline-none focus:border-cyan-400 mt-1"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300">Registration Plate</label>
              <input
                required
                value={form.registrationNumber}
                onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-slate-950 p-2.5 text-white outline-none focus:border-cyan-400 mt-1 uppercase"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300">Vehicle Type</label>
              <select
                value={form.vehicleType}
                onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-slate-950 p-2.5 text-white outline-none focus:border-cyan-400 mt-1"
              >
                <option value="Car">Car / Sedan</option>
                <option value="SUV">SUV / Crossover</option>
                <option value="Truck">Commercial Truck</option>
                <option value="Bus">Bus / Coach</option>
                <option value="Van">Van / LCV</option>
                <option value="Two-Wheeler">Two-Wheeler</option>
                <option value="Heavy Duty">Heavy Duty Equipment</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-300">Current Odometer (km)</label>
              <input
                required
                type="number"
                value={form.currentOdometer}
                onChange={(e) => setForm({ ...form, currentOdometer: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-slate-950 p-2.5 text-white outline-none focus:border-cyan-400 mt-1"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300">Fuel Type</label>
              <select
                value={form.fuelType}
                onChange={(e) => setForm({ ...form, fuelType: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-slate-950 p-2.5 text-white outline-none focus:border-cyan-400 mt-1"
              >
                <option value="petrol">Petrol</option>
                <option value="diesel">Diesel</option>
                <option value="electric">Electric</option>
                <option value="cng">CNG</option>
                <option value="hybrid">Hybrid</option>
                <option value="lpg">LPG</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-300">Transmission</label>
              <select
                value={form.transmission}
                onChange={(e) => setForm({ ...form, transmission: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-slate-950 p-2.5 text-white outline-none focus:border-cyan-400 mt-1"
              >
                <option value="manual">Manual</option>
                <option value="automatic">Automatic</option>
                <option value="cvt">CVT</option>
                <option value="dct">DCT</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-300">Manufacturing Year</label>
              <input
                type="number"
                value={form.manufacturingYear}
                onChange={(e) => setForm({ ...form, manufacturingYear: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-slate-950 p-2.5 text-white outline-none focus:border-cyan-400 mt-1"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-slate-950 p-2.5 text-white outline-none focus:border-cyan-400 mt-1"
              >
                <option value="active">Active</option>
                <option value="in_service">In Service / Maintenance</option>
                <option value="idle">Idle / Garage</option>
                <option value="sold">Decommissioned / Sold</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-400/20 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </motion.form>
      </motion.div>
    </AnimatePresence>
  );
}
