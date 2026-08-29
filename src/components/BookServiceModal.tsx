import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';

type Vehicle = {
  _id: string;
  vehicleName?: string;
  manufacturer: string;
  model: string;
  registrationNumber: string;
};

type ServiceCenter = {
  _id: string;
  name: string;
  city?: string;
  address?: string;
  phone?: string;
  rating?: number;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  preselectedVehicleId?: string;
  onSuccess?: () => void;
};

export default function BookServiceModal({
  isOpen,
  onClose,
  vehicles,
  preselectedVehicleId,
  onSuccess,
}: Props) {
  const [serviceCenters, setServiceCenters] = useState<ServiceCenter[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState(preselectedVehicleId || '');
  const [serviceCenter, setServiceCenter] = useState('');
  const [serviceType, setServiceType] = useState('routine');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('10:00 AM');
  const [contactNumber, setContactNumber] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingCenters, setFetchingCenters] = useState(true);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState<any>(null);

  useEffect(() => {
    if (preselectedVehicleId) {
      setSelectedVehicle(preselectedVehicleId);
    } else if (vehicles.length > 0 && !selectedVehicle) {
      setSelectedVehicle(vehicles[0]._id);
    }
  }, [preselectedVehicleId, vehicles]);

  useEffect(() => {
    if (!isOpen) return;
    setFetchingCenters(true);
    setError('');
    setConfirmation(null);

    api
      .get('/service-centers')
      .then(({ data }) => {
        const centers = data.centers || [];
        setServiceCenters(centers);
        if (centers.length > 0) setServiceCenter(centers[0]._id);
      })
      .catch(() => {
        setError('Failed to fetch service centers.');
      })
      .finally(() => setFetchingCenters(false));
  }, [isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedVehicle) return setError('Please select a vehicle.');
    if (!serviceCenter) return setError('Please select a service center.');
    if (!scheduledDate) return setError('Please select a preferred date.');
    if (!scheduledTime) return setError('Please select a preferred time.');
    if (!contactNumber) return setError('Please enter a contact number.');

    setLoading(true);

    try {
      const payload = {
        vehicle: selectedVehicle,
        serviceCenter,
        serviceType,
        scheduledDate,
        scheduledTime,
        contactNumber,
        description,
      };

      const { data } = await api.post('/appointments', payload);
      setConfirmation(data.appointment);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Unable to submit service booking.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
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
          className="w-full max-w-xl rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl space-y-4 my-8"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
                </svg>
              </span>
              <div>
                <h2 className="text-xl font-bold text-white">Book Fleet Vehicle Service</h2>
                <p className="text-xs text-slate-400">Schedule certified maintenance for your fleet asset.</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white font-bold"
            >
              ✕
            </button>
          </div>

          {confirmation ? (
            /* Confirmation View */
            <div className="space-y-4 py-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-white">Service Booking Confirmed!</h3>
              <p className="text-xs text-slate-300">
                Your appointment ID is <span className="font-mono font-bold text-cyan-400">{confirmation.bookingId || confirmation._id}</span>.
              </p>

              <div className="rounded-2xl border border-white/10 bg-slate-950 p-4 text-left text-xs space-y-2 text-slate-300">
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-slate-400">Vehicle:</span>
                  <span className="font-bold text-white">
                    {confirmation.vehicle?.vehicleName || confirmation.vehicle?.registrationNumber || 'Selected Asset'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-slate-400">Service Center:</span>
                  <span className="font-bold text-white">{confirmation.serviceCenter?.name || 'Authorized Center'}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-slate-400">Scheduled Date & Time:</span>
                  <span className="font-bold text-cyan-300">
                    {new Date(confirmation.scheduledDate).toLocaleDateString()} at {confirmation.scheduledTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Service Type:</span>
                  <span className="font-bold text-emerald-400 uppercase">{confirmation.serviceType}</span>
                </div>
              </div>

              <div className="pt-3">
                <button
                  onClick={onClose}
                  className="w-full rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-400/20"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Booking Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-200">
                  ⚠ {error}
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2 text-xs">
                {/* Vehicle Selector */}
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Vehicle</label>
                  <select
                    required
                    value={selectedVehicle}
                    onChange={(e) => setSelectedVehicle(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 p-2.5 text-white outline-none focus:border-cyan-400"
                  >
                    <option value="" disabled>Select Vehicle</option>
                    {vehicles.map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.vehicleName || `${v.manufacturer} ${v.model}`} ({v.registrationNumber})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Service Center Selector */}
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Service Center</label>
                  {fetchingCenters ? (
                    <div className="rounded-xl border border-white/10 bg-slate-950 p-2.5 text-slate-500">Loading centers...</div>
                  ) : (
                    <select
                      required
                      value={serviceCenter}
                      onChange={(e) => setServiceCenter(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-slate-950 p-2.5 text-white outline-none focus:border-cyan-400"
                    >
                      <option value="" disabled>Select Service Center</option>
                      {serviceCenters.map((sc) => (
                        <option key={sc._id} value={sc._id}>
                          {sc.name} {sc.city ? `(${sc.city})` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Service Type */}
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Service Type</label>
                  <select
                    required
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 p-2.5 text-white outline-none focus:border-cyan-400"
                  >
                    <option value="routine">Routine Maintenance</option>
                    <option value="repair">Full Repair & Overhaul</option>
                    <option value="emergency">Emergency Breakdown Service</option>
                    <option value="inspection">Comprehensive Safety Inspection</option>
                    <option value="ac_service">AC & Climate Service</option>
                    <option value="tyre_service">Tyre Rotation & Balancing</option>
                    <option value="battery_service">EV / Lead-Acid Battery Check</option>
                    <option value="body_work">Body Work & Paint</option>
                    <option value="other">Other Service</option>
                  </select>
                </div>

                {/* Contact Number */}
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Contact Number</label>
                  <input
                    required
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 p-2.5 text-white outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Preferred Date */}
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Preferred Date</label>
                  <input
                    required
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 p-2.5 text-white outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Preferred Time */}
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Preferred Time</label>
                  <select
                    required
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 p-2.5 text-white outline-none focus:border-cyan-400"
                  >
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="11:30 AM">11:30 AM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="04:00 PM">04:00 PM</option>
                    <option value="06:00 PM">06:00 PM</option>
                  </select>
                </div>
              </div>

              {/* Problem Description */}
              <div className="text-xs">
                <label className="block font-bold text-slate-300 mb-1">Problem Description / Notes</label>
                <textarea
                  rows={3}
                  placeholder="Describe any symptoms, noise, warning indicators, or specific service requests..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 p-2.5 text-white outline-none focus:border-cyan-400"
                />
              </div>

              {/* Modal Actions */}
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
                  disabled={loading}
                  className="rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-400/20 disabled:opacity-50"
                >
                  {loading ? 'Booking Service…' : 'Confirm Service Booking'}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
