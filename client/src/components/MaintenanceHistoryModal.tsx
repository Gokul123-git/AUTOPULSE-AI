import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  vehicleId: string;
  vehicleName: string;
};

export default function MaintenanceHistoryModal({ isOpen, onClose, vehicleId, vehicleName }: Props) {
  const [records, setRecords] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !vehicleId) return;
    setLoading(true);

    Promise.all([
      api.get(`/maintenance?vehicle=${vehicleId}`).catch(() => ({ data: { records: [] } })),
      api.get(`/appointments?vehicle=${vehicleId}`).catch(() => ({ data: { appointments: [] } })),
    ])
      .then(([mRes, aRes]) => {
        setRecords(mRes.data.records || []);
        setAppointments(aRes.data.appointments || []);
      })
      .finally(() => setLoading(false));
  }, [isOpen, vehicleId]);

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
          className="w-full max-w-3xl rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl space-y-4 my-8"
        >
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div>
              <h2 className="text-xl font-bold text-white">Maintenance & Service Log</h2>
              <p className="text-xs text-slate-400">Audit trail for {vehicleName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white font-bold"
            >
              ✕
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs font-bold text-cyan-400">
              Fetching vehicle service logs...
            </div>
          ) : (
            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
              {/* Upcoming / Booked Service Appointments */}
              <div>
                <h3 className="text-sm font-bold text-cyan-300 uppercase tracking-wider mb-2">
                  Service Bookings ({appointments.length})
                </h3>
                {appointments.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No service bookings recorded for this asset.</p>
                ) : (
                  <div className="space-y-2">
                    {appointments.map((apt) => (
                      <div
                        key={apt._id}
                        className="rounded-2xl border border-white/5 bg-slate-950 p-3 text-xs flex flex-wrap items-center justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white uppercase">{apt.serviceType}</span>
                            <span className="rounded-full bg-cyan-500/10 text-cyan-300 px-2 py-0.5 text-[10px] font-bold border border-cyan-500/20">
                              {apt.status}
                            </span>
                          </div>
                          <p className="text-slate-400 mt-1">
                            Center: <span className="text-slate-200">{apt.serviceCenter?.name || 'Authorized Hub'}</span>
                          </p>
                          {apt.description && <p className="text-slate-400 italic mt-0.5">"{apt.description}"</p>}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-cyan-400">
                            {new Date(apt.scheduledDate).toLocaleDateString()}
                          </p>
                          <p className="text-[10px] text-slate-400">{apt.scheduledTime}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recorded Maintenance Work Logs */}
              <div>
                <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-2">
                  Maintenance History ({records.length})
                </h3>
                {records.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No past maintenance records logged.</p>
                ) : (
                  <div className="space-y-2">
                    {records.map((rec) => (
                      <div
                        key={rec._id}
                        className="rounded-2xl border border-white/5 bg-slate-950 p-3 text-xs flex flex-wrap items-center justify-between gap-2"
                      >
                        <div>
                          <p className="font-bold text-white">{rec.title || rec.type}</p>
                          <p className="text-slate-400 mt-1">{rec.notes || 'Routine maintenance performed.'}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-emerald-400">₹{rec.cost?.total || rec.cost || 0}</p>
                          <p className="text-[10px] text-slate-400">
                            {new Date(rec.serviceDate || rec.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-white/[0.08]">
            <button
              onClick={onClose}
              className="rounded-xl border border-white/10 px-5 py-2 text-xs font-bold text-slate-300 hover:text-white"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
