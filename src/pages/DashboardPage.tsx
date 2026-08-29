import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import BookServiceModal from '../components/BookServiceModal';

// ─── Types ───────────────────────────────────────────────────────────────────
type Vehicle = {
  _id: string;
  vehicleName?: string;
  manufacturer: string;
  model: string;
  registrationNumber: string;
  images?: string[];
  currentOdometer: number;
  fuelType?: string;
  year?: number;
  vin?: string;
  status?: string;
};

type Component = {
  name: string;
  score: number;
  risk: number;
  severity: string;
  reasons: string[];
  recommendation: string;
  estimatedCost: number;
  recommendedWithinDays: number;
};

type Recommendation = {
  component: string;
  priority: string;
  reason: string;
  recommendation: string;
  estimatedCost: number;
  dueDate: string;
};

type FuelEfficiencyAnalysis = {
  recordedKmPerL: number;
  fuelLevel: number;
  reason: string;
  recommendation: string;
};

type Analysis = {
  overallHealth: number;
  breakdownRisk: number;
  remainingUsefulLifeDays: number;
  nextMaintenanceDate: string;
  engineHealth: number;
  batteryHealth: number;
  brakeHealth: number;
  tyreHealth: number;
  fuelEfficiencyAnalysis: FuelEfficiencyAnalysis;
  components: Component[];
  recommendations: Recommendation[];
  source?: string;
  generatedAt?: string;
};

type Location = {
  latitude: number;
  longitude: number;
  speed?: number;
  capturedAt: string;
};

// ─── Status Configuration Helper ──────────────────────────────────────────────
const getStatusConfig = (score: number) => {
  if (score >= 80) {
    return {
      text: 'Optimal',
      label: 'Healthy',
      color: 'emerald',
      dot: 'bg-emerald-400',
      badge: 'bg-emerald-400/10 border-emerald-400/20 text-emerald-300',
      progressBg: 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.4)]',
      glow: 'shadow-emerald-400/20',
      hex: '#34d399',
    };
  }
  if (score >= 60) {
    return {
      text: 'Attention',
      label: 'Warning',
      color: 'amber',
      dot: 'bg-amber-400',
      badge: 'bg-amber-400/10 border-amber-400/20 text-amber-300',
      progressBg: 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.4)]',
      glow: 'shadow-amber-400/20',
      hex: '#fbbf24',
    };
  }
  return {
    text: 'Critical',
    label: 'High Risk',
    color: 'red',
    dot: 'bg-red-400',
    badge: 'bg-red-400/10 border-red-400/20 text-red-300',
    progressBg: 'bg-red-400 shadow-[0_0_12px_rgba(248,113,113,0.4)]',
    glow: 'shadow-red-400/20',
    hex: '#f87171',
  };
};

const getVehicleDisplayName = (v: Vehicle) => v.vehicleName || `${v.manufacturer} ${v.model}`;

// ─── Motion Variants ─────────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 90, damping: 14 } },
};

// ─── Component 1: Pulsing Status Dot ──────────────────────────────────────────
function StatusDot({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const cfg = getStatusConfig(score);
  const sizeClasses =
    size === 'sm' ? 'h-2 w-2' : size === 'lg' ? 'h-3.5 w-3.5' : 'h-2.5 w-2.5';

  return (
    <span className={`relative inline-flex ${sizeClasses} items-center justify-center`}>
      <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${cfg.dot} opacity-75`} />
      <span className={`relative inline-flex ${sizeClasses} rounded-full ${cfg.dot} ${cfg.glow} shadow-md`} />
    </span>
  );
}

// ─── Component 2: Vehicle Health Score Circular Gauge ────────────────────────
function VehicleHealthScoreRing({ score }: { score: number }) {
  const cfg = getStatusConfig(score);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference * (1 - score / 100);

  return (
    <motion.article
      variants={itemVariants}
      className="group relative flex flex-col items-center justify-between overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-900/60 p-6 backdrop-blur-xl transition-all duration-300 hover:border-cyan-500/30 hover:shadow-[0_0_25px_rgba(6,182,212,0.15)]"
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan-500/10 blur-2xl group-hover:bg-cyan-500/20 transition-all duration-500" />
      
      <div className="flex w-full items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
          Vehicle Health Score
        </p>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cfg.badge}`}>
          <StatusDot score={score} size="sm" />
          {cfg.text}
        </span>
      </div>

      <div className="relative my-4 flex items-center justify-center">
        <svg className="h-40 w-40 -rotate-90 transform" viewBox="0 0 120 120">
          {/* Outer track */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth="10"
          />
          {/* Animated progress ring */}
          <motion.circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={cfg.hex}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: strokeOffset }}
            transition={{ duration: 1.5, ease: 'easeOut', delay: 0.2 }}
            style={{
              filter: `drop-shadow(0 0 12px ${cfg.hex}88)`,
            }}
          />
        </svg>

        <div className="absolute flex flex-col items-center text-center">
          <motion.span
            className="text-4xl font-extrabold tracking-tight text-white"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            {score}<span className="text-xl font-medium text-slate-400">%</span>
          </motion.span>
          <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-400">
            Overall AI Index
          </span>
        </div>
      </div>

      <div className="w-full text-center">
        <p className="text-xs text-slate-400">
          {score >= 80
            ? 'All core systems performing within optimal factory parameters.'
            : score >= 60
            ? 'Some components require preventive maintenance soon.'
            : 'Immediate mechanical inspection recommended.'}
        </p>
      </div>
    </motion.article>
  );
}

// ─── Component 3: Glassmorphic Metric Card ────────────────────────────────────
function MetricCard({
  title,
  value,
  subtitle,
  score,
  icon,
  badgeText,
  children,
}: {
  title: string;
  value?: string;
  subtitle?: string;
  score?: number;
  icon?: React.ReactNode;
  badgeText?: string;
  children?: React.ReactNode;
}) {
  const cfg = score !== undefined ? getStatusConfig(score) : null;

  return (
    <motion.article
      variants={itemVariants}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-900/60 p-5 backdrop-blur-xl transition-all duration-300 hover:border-white/[0.18] hover:bg-slate-900/80 hover:shadow-xl"
    >
      <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-b from-white/[0.05] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {cfg && <StatusDot score={score!} size="sm" />}
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
              {title}
            </span>
          </div>
          {icon && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.05] text-slate-300">
              {icon}
            </div>
          )}
        </div>

        {value && (
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-2xl font-extrabold tracking-tight text-white">{value}</h3>
            {badgeText && (
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${cfg ? cfg.badge : 'bg-cyan-400/10 border-cyan-400/20 text-cyan-300'}`}>
                {badgeText}
              </span>
            )}
          </div>
        )}

        {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
        {children}
      </div>

      {score !== undefined && (
        <div className="relative z-10 mt-4">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800/80">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
              className={`h-full rounded-full ${cfg?.progressBg}`}
            />
          </div>
        </div>
      )}
    </motion.article>
  );
}

// ─── Main AI Dashboard Component ──────────────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [reading, setReading] = useState<any>();
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recFilter, setRecFilter] = useState<string>('all');
  const [alertFilter, setAlertFilter] = useState<string>('all');
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);
  const [openBookService, setOpenBookService] = useState(false);
  const [userBookings, setUserBookings] = useState<any[]>([]);

  // ── Fetch Vehicles & Appointments ──
  const fetchBookings = () => {
    api.get('/appointments').then(({ data }) => setUserBookings(data.appointments || [])).catch(() => {});
  };

  useEffect(() => {
    fetchBookings();
    api
      .get('/vehicles')
      .then(({ data }) => {
        const list: Vehicle[] = data.vehicles || [];
        setVehicles(list);
        if (list.length > 0) {
          setSelectedId(list[0]._id);
        }
      })
      .catch((e) => setError(e.response?.data?.error || 'Unable to load fleet vehicles.'))
      .finally(() => setLoading(false));
  }, []);

  // ── Fetch Inspection Health Readings & Location ──
  useEffect(() => {
    if (!selectedId) return;
    setReading(undefined);
    setLocation(null);

    api
      .get(`/health-readings?vehicleId=${selectedId}`)
      .then((r) => {
        setReading(r.data.readings?.[0]);
      })
      .catch(() => {});

    api
      .get(`/tracking/vehicles/${selectedId}/current`)
      .then((r) => setLocation(r.data.location))
      .catch(() => setLocation(null));
  }, [selectedId]);

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex min-h-[85vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative flex h-14 w-14 items-center justify-center">
            <div className="absolute inset-0 animate-ping rounded-full bg-cyan-400/20" />
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
          </div>
          <p className="text-sm font-semibold tracking-wide text-cyan-300">
            Initializing AI Diagnostic Engine…
          </p>
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-6">
        <div className="max-w-md rounded-2xl border border-red-500/30 bg-red-950/30 p-8 text-center backdrop-blur-xl shadow-2xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/20 text-red-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="mt-4 text-xl font-bold text-white">Dashboard Error</h2>
          <p className="mt-2 text-sm text-red-200/80">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:opacity-90"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // ── No vehicles state ──
  if (!vehicles.length) {
    return (
      <main className="flex min-h-[85vh] items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg rounded-3xl border border-white/[0.08] bg-slate-900/80 p-10 text-center backdrop-blur-2xl shadow-2xl"
        >
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 text-cyan-400 border border-cyan-500/30">
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
          </div>
          <span className="mt-6 inline-block text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-400">
            AutoPulse AI Platform
          </span>
          <h1 className="mt-2 text-2xl font-extrabold text-white">No Vehicles Registered</h1>
          <p className="mt-3 text-sm text-slate-400 leading-relaxed">
            Register your first vehicle to unlock real-time telemetry analytics, predictive maintenance AI, breakdown risk modeling, and component health tracking.
          </p>
          <Link
            to="/vehicles"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-400/25 transition-all hover:scale-[1.02]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Register Vehicle Now
          </Link>
        </motion.div>
      </main>
    );
  }

  // Selected vehicle & Analysis Data
  const vehicle = vehicles.find((v) => v._id === selectedId) || vehicles[0];
  const analysis: Analysis | undefined = reading?.analysis;

  // Components & Recommendations
  const components = analysis?.components || [];
  const recommendations = analysis?.recommendations || [];
  const fuelEff = analysis?.fuelEfficiencyAnalysis;

  // Filtered Recommendations
  const filteredRecs = recommendations.filter((r) => {
    if (recFilter === 'all') return true;
    return r.priority.toLowerCase() === recFilter.toLowerCase();
  });

  // Filtered Alerts
  const allAlerts = components.filter((c) => c.score < 80);
  const criticalAlerts = components.filter((c) => c.score < 60);
  const warningAlerts = components.filter((c) => c.score >= 60 && c.score < 80);

  const displayedAlerts =
    alertFilter === 'critical'
      ? criticalAlerts
      : alertFilter === 'warning'
      ? warningAlerts
      : allAlerts;

  return (
    <main className="min-h-screen bg-[#030712] px-4 py-8 sm:px-6 lg:px-8">
      {/* Background Glow Orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute -right-40 top-1/3 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-10 left-1/3 h-[400px] w-[400px] rounded-full bg-indigo-500/10 blur-[120px]" />
      </div>

      <motion.div
        className="relative z-10 mx-auto max-w-7xl space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ─────── TOP HEADER & VEHICLE SELECTOR ─────── */}
        <motion.header
          variants={itemVariants}
          className="flex flex-col gap-6 rounded-3xl border border-white/[0.08] bg-slate-900/60 p-6 backdrop-blur-2xl lg:flex-row lg:items-center lg:justify-between shadow-2xl"
        >
          {/* Vehicle Info & Avatar */}
          <div className="flex flex-wrap items-center gap-5">
            {/* Vehicle Image */}
            <div className="group relative h-20 w-24 flex-shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80 shadow-inner">
              {vehicle.images?.[0] ? (
                <img
                  src={vehicle.images[0]}
                  alt={getVehicleDisplayName(vehicle)}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-cyan-400">
                  <svg className="h-8 w-8 text-cyan-400/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                  </svg>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60" />
            </div>

            {/* Vehicle Details */}
            <div>
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-400/10 border border-cyan-400/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  AI Telematics Active
                </span>
                {vehicle.fuelType && (
                  <span className="rounded-full bg-slate-800 border border-white/10 px-2.5 py-0.5 text-[10px] font-semibold text-slate-300 capitalize">
                    {vehicle.fuelType}
                  </span>
                )}
              </div>

              <h1 className="mt-1.5 text-2xl font-black text-white sm:text-3xl tracking-tight">
                {getVehicleDisplayName(vehicle)}
              </h1>

              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-400">
                <span className="inline-flex items-center gap-1 font-semibold text-slate-200">
                  <svg className="h-3.5 w-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h-3a2 2 0 00-2 2v4m4-4h3m-3 0l3-3m-3 3l3 3" />
                  </svg>
                  {vehicle.registrationNumber}
                </span>
                <span>·</span>
                <span>{Number(vehicle.currentOdometer).toLocaleString()} km</span>
                {vehicle.year && (
                  <>
                    <span>·</span>
                    <span>{vehicle.year}</span>
                  </>
                )}
                {vehicle.vin && (
                  <>
                    <span>·</span>
                    <span className="font-mono text-[11px] text-slate-400">VIN: {vehicle.vin}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Controls & Switcher */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-full sm:w-auto">
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Select Fleet Vehicle
              </label>
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/90 px-4 py-2.5 pr-10 text-sm font-medium text-white backdrop-blur-xl transition-all focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 sm:w-64"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2338bdf8' strokeWidth='2'%3E%3Cpath strokeLinecap='round' strokeLinejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  backgroundSize: '16px',
                }}
              >
                {vehicles.map((v) => (
                  <option key={v._id} value={v._id} className="bg-slate-900 text-white">
                    {getVehicleDisplayName(v)} — {v.registrationNumber}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setOpenBookService(true)}
              className="mt-4 sm:mt-5 inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-xs font-bold text-cyan-300 shadow-lg shadow-cyan-500/10 transition-all hover:bg-cyan-500/20"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
              </svg>
              Book Service
            </button>

            <Link
              to={`/vehicles/${selectedId}/inspection`}
              className="mt-4 sm:mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-400/20 transition-all hover:scale-105"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              New Inspection
            </Link>
          </div>
        </motion.header>

        {/* ─────── NO INSPECTION ALERT ─────── */}
        {!analysis ? (
          <motion.section
            variants={itemVariants}
            className="overflow-hidden rounded-3xl border border-amber-400/30 bg-gradient-to-br from-amber-500/10 via-slate-900/90 to-slate-900/90 p-8 backdrop-blur-2xl shadow-2xl"
          >
            <div className="flex flex-col items-center gap-5 text-center md:flex-row md:text-left">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-400/20 border border-amber-400/30 text-amber-300">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white">Inspection Data Required</h2>
                <p className="mt-1 text-sm text-slate-300 leading-relaxed">
                  No health analysis is currently available for <strong className="text-amber-300">{getVehicleDisplayName(vehicle)}</strong>. Run a multi-point AI inspection to generate component scores, breakdown risk models, and predictive service timelines.
                </p>
              </div>
              <Link
                to={`/vehicles/${selectedId}/inspection`}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-400/20 transition-all hover:scale-105"
              >
                Run Inspection Now
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </motion.section>
        ) : (
          <>
            {/* ─────── TOP EXECUTIVE METRICS ROW ─────── */}
            <motion.section
              variants={itemVariants}
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
            >
              {/* 1. Vehicle Health Score */}
              <VehicleHealthScoreRing score={analysis.overallHealth} />

              {/* 2. Breakdown Risk */}
              <MetricCard
                title="Breakdown Risk"
                value={`${analysis.breakdownRisk}%`}
                score={100 - analysis.breakdownRisk}
                badgeText={analysis.breakdownRisk > 40 ? 'High Risk' : analysis.breakdownRisk > 20 ? 'Moderate' : 'Low Risk'}
                subtitle="Calculated AI failure probability"
                icon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                }
              >
                <div className="mt-2 text-xs text-slate-400">
                  {analysis.breakdownRisk > 40 ? (
                    <span className="font-semibold text-red-400">⚠ Breakdown probability is elevated. Schedule immediate check.</span>
                  ) : (
                    <span className="text-emerald-400">✓ Low probability of unexpected breakdown.</span>
                  )}
                </div>
              </MetricCard>

              {/* 3. Remaining Useful Life (RUL) */}
              <MetricCard
                title="Remaining Useful Life"
                value={`${analysis.remainingUsefulLifeDays} days`}
                score={Math.min(100, Math.round((analysis.remainingUsefulLifeDays / 365) * 100))}
                badgeText={`~${Math.round(analysis.remainingUsefulLifeDays / 30)} Months`}
                subtitle="Projected operational lifespan"
                icon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              >
                <p className="mt-2 text-xs text-slate-400">
                  Estimated based on component wear rates & telemetry logs.
                </p>
              </MetricCard>

              {/* 4. Next Service Date */}
              <MetricCard
                title="Next Service Date"
                value={new Date(analysis.nextMaintenanceDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
                subtitle="Scheduled preventive service"
                icon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                }
              >
                <Link
                  to="/maintenance"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Schedule Service Appointment
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              </MetricCard>
            </motion.section>

            {/* ─────── SUB-SYSTEM HEALTH GAUGES GRID ─────── */}
            <motion.section variants={itemVariants} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">
                  Sub-System Health Gauges
                </h2>
                <span className="text-xs text-slate-400">
                  6 Core Vehicle Systems Monitored
                </span>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {/* 1. Engine Health */}
                <MetricCard
                  title="Engine Health"
                  value={`${analysis.engineHealth}%`}
                  score={analysis.engineHealth}
                  badgeText={getStatusConfig(analysis.engineHealth).text}
                  icon={
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121 7.5z" />
                    </svg>
                  }
                />

                {/* 2. Battery Health */}
                <MetricCard
                  title="Battery Health"
                  value={`${analysis.batteryHealth}%`}
                  score={analysis.batteryHealth}
                  badgeText={getStatusConfig(analysis.batteryHealth).text}
                  icon={
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
                  }
                />

                {/* 3. Brake Health */}
                <MetricCard
                  title="Brake Health"
                  value={`${analysis.brakeHealth}%`}
                  score={analysis.brakeHealth}
                  badgeText={getStatusConfig(analysis.brakeHealth).text}
                  icon={
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.05a10 10 0 100 20 10 10 0 000-20z" />
                    </svg>
                  }
                />

                {/* 4. Tyre Health */}
                <MetricCard
                  title="Tyre Health"
                  value={`${analysis.tyreHealth}%`}
                  score={analysis.tyreHealth}
                  badgeText={getStatusConfig(analysis.tyreHealth).text}
                  icon={
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18zM12 9v6m-3-3h6" />
                    </svg>
                  }
                />

                {/* 5. Fuel Efficiency */}
                <MetricCard
                  title="Fuel Efficiency"
                  value={fuelEff ? `${fuelEff.recordedKmPerL} km/l` : 'N/A'}
                  score={
                    fuelEff
                      ? fuelEff.recordedKmPerL >= 15
                        ? 85
                        : fuelEff.recordedKmPerL >= 10
                        ? 65
                        : 40
                      : 50
                  }
                  badgeText={fuelEff ? `Fuel ${fuelEff.fuelLevel}%` : 'N/A'}
                  icon={
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 0112 3c1.268 0 2.472.28 3.555.782" />
                    </svg>
                  }
                />

                {/* 6. Est. Maint. Cost */}
                <MetricCard
                  title="Est. Maint. Cost"
                  value={`₹${recommendations.reduce((s, r) => s + r.estimatedCost, 0).toLocaleString()}`}
                  score={
                    recommendations.reduce((s, r) => s + r.estimatedCost, 0) > 20000
                      ? 35
                      : recommendations.reduce((s, r) => s + r.estimatedCost, 0) > 8000
                      ? 65
                      : 90
                  }
                  badgeText={`${recommendations.length} Pending`}
                  icon={
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                />
              </div>
            </motion.section>

            {/* ─────── AI RECOMMENDATIONS & CRITICAL ALERTS MAIN PANEL ─────── */}
            <motion.section variants={itemVariants} className="grid gap-6 lg:grid-cols-3">
              {/* Left Column (2/3): AI Recommendations */}
              <div className="lg:col-span-2 space-y-4 rounded-3xl border border-white/[0.08] bg-slate-900/60 p-6 backdrop-blur-2xl shadow-2xl">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                        </svg>
                      </span>
                      <h2 className="text-lg font-bold text-white">AI Recommendations</h2>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Predictive action items derived from vehicle diagnostics.
                    </p>
                  </div>

                  {/* Priority Filter Tabs */}
                  <div className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-950/80 p-1 border border-white/10 text-xs">
                    {['all', 'critical', 'high', 'medium', 'low'].map((f) => (
                      <button
                        key={f}
                        onClick={() => setRecFilter(f)}
                        className={`rounded-lg px-3 py-1 font-semibold uppercase tracking-wider transition-all ${
                          recFilter === f
                            ? 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/30'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recommendations List */}
                <div className="space-y-3.5 pt-2">
                  {filteredRecs.length > 0 ? (
                    filteredRecs.map((rec, i) => {
                      const priorityTag = rec.priority.toLowerCase();
                      const tagColors: Record<string, string> = {
                        critical: 'bg-red-500/15 border-red-500/30 text-red-300',
                        high: 'bg-orange-500/15 border-orange-500/30 text-orange-300',
                        medium: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
                        low: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
                      };
                      return (
                        <motion.div
                          key={rec.component + i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="group relative rounded-2xl border border-white/[0.06] bg-slate-950/50 p-4 transition-all hover:border-white/15 hover:bg-slate-950/80"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <StatusDot
                                score={
                                  priorityTag === 'critical'
                                    ? 30
                                    : priorityTag === 'high'
                                    ? 55
                                    : priorityTag === 'medium'
                                    ? 75
                                    : 90
                                }
                              />
                              <h3 className="font-bold text-white text-sm">{rec.component} System</h3>
                            </div>
                            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tagColors[priorityTag] || tagColors.medium}`}>
                              {rec.priority} Priority
                            </span>
                          </div>

                          <p className="mt-2 text-xs leading-relaxed text-slate-300">
                            <strong className="text-slate-400 font-semibold">Root Cause:</strong> {rec.reason}
                          </p>

                          <div className="mt-2 rounded-xl bg-cyan-950/30 border border-cyan-500/10 p-2.5 text-xs text-cyan-200">
                            <strong className="font-semibold text-cyan-300">AI Action Plan:</strong> {rec.recommendation}
                          </div>

                          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pt-2 border-t border-white/[0.04]">
                            <div className="flex items-center gap-4">
                              <span className="inline-flex items-center gap-1 font-semibold text-slate-200">
                                <svg className="h-3.5 w-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Est. ₹{rec.estimatedCost.toLocaleString()}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                </svg>
                                Target: {new Date(rec.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </span>
                            </div>

                            <Link
                              to="/maintenance"
                              className="inline-flex items-center gap-1 font-semibold text-cyan-400 hover:text-cyan-300 transition-colors text-[11px]"
                            >
                              Schedule Repair →
                            </Link>
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <div className="flex items-center gap-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-5 text-emerald-200">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-400/20 text-emerald-300">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Optimal Performance</p>
                        <p className="text-xs text-emerald-300/80">No active maintenance recommendations matching current filter.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column (1/3): Critical Alerts & Telematics */}
              <div className="space-y-6">
                {/* Critical Alerts Card */}
                <div className="rounded-3xl border border-white/[0.08] bg-slate-900/60 p-6 backdrop-blur-2xl shadow-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                      </span>
                      <h2 className="text-lg font-bold text-white">Critical Alerts</h2>
                    </div>

                    <div className="flex items-center gap-1 rounded-lg bg-slate-950/80 p-0.5 border border-white/10 text-[10px]">
                      <button
                        onClick={() => setAlertFilter('all')}
                        className={`rounded px-2 py-0.5 font-bold ${alertFilter === 'all' ? 'bg-red-500/20 text-red-300' : 'text-slate-400'}`}
                      >
                        All ({allAlerts.length})
                      </button>
                      <button
                        onClick={() => setAlertFilter('critical')}
                        className={`rounded px-2 py-0.5 font-bold ${alertFilter === 'critical' ? 'bg-red-500/20 text-red-300' : 'text-slate-400'}`}
                      >
                        Critical ({criticalAlerts.length})
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {displayedAlerts.length > 0 ? (
                      displayedAlerts.map((item) => {
                        const isCrit = item.score < 60;
                        return (
                          <div
                            key={item.name}
                            className={`rounded-2xl p-3.5 border transition-all ${
                              isCrit
                                ? 'bg-red-950/30 border-red-500/20 text-red-200'
                                : 'bg-amber-950/30 border-amber-500/20 text-amber-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <StatusDot score={item.score} size="sm" />
                                <h3 className="font-bold text-sm text-white">{item.name} Alert</h3>
                              </div>
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${isCrit ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'}`}>
                                Score: {item.score}%
                              </span>
                            </div>

                            <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                              {item.reasons.join(' ')}
                            </p>

                            <div className="mt-2 text-[11px] font-medium text-slate-400">
                              Recommendation: <span className="text-white">{item.recommendation}</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex items-center gap-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-emerald-300">
                        <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-xs font-semibold">No critical or warning alerts detected.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Fuel & GPS Telematics Status */}
                <div className="rounded-3xl border border-white/[0.08] bg-slate-900/60 p-6 backdrop-blur-2xl shadow-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-white">Live Telematics & GPS</h2>
                    <span className="flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-ping" />
                  </div>

                  {fuelEff && (
                    <div className="rounded-2xl bg-slate-950/60 p-3.5 border border-white/5">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Fuel Efficiency</span>
                        <span className="text-lg font-extrabold text-cyan-300">{fuelEff.recordedKmPerL} <span className="text-xs text-slate-400">km/l</span></span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400 leading-relaxed">{fuelEff.reason}</p>
                    </div>
                  )}

                  <div className="rounded-2xl bg-slate-950/60 p-3.5 border border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-400 uppercase tracking-wider">GPS Position</span>
                      {location ? (
                        <span className="text-emerald-400 font-semibold">Online ({location.speed || 0} km/h)</span>
                      ) : (
                        <span className="text-slate-400">Offline / Idle</span>
                      )}
                    </div>
                    {location ? (
                      <p className="text-xs font-mono text-slate-300">
                        Lat: {location.latitude.toFixed(4)} · Long: {location.longitude.toFixed(4)}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400">No active GPS stream.</p>
                    )}

                    <Link
                      to={`/vehicles/${selectedId}/tracking`}
                      className="mt-2 inline-flex items-center justify-center w-full rounded-xl bg-slate-800 border border-white/10 py-2 text-xs font-bold text-cyan-300 hover:bg-slate-700 transition-colors"
                    >
                      Open GPS Map Tracking →
                    </Link>
                  </div>
                </div>
              </div>
            </motion.section>
          </>
        )}
      </motion.div>

      <BookServiceModal
        isOpen={openBookService}
        onClose={() => setOpenBookService(false)}
        vehicles={vehicles}
        preselectedVehicleId={selectedId}
        onSuccess={fetchBookings}
      />
    </main>
  );
}
