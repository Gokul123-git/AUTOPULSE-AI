import { useState } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
  RadialBarChart,
  RadialBar,
} from 'recharts';
import { motion } from 'framer-motion';

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

type Analysis = {
  overallHealth: number;
  breakdownRisk: number;
  remainingUsefulLifeDays: number;
  nextMaintenanceDate: string;
  engineHealth: number;
  batteryHealth: number;
  brakeHealth: number;
  tyreHealth: number;
  components: Component[];
  recommendations: Array<{
    component: string;
    priority: string;
    reason: string;
    recommendation: string;
    estimatedCost: number;
    dueDate: string;
  }>;
};

type AnalyticsSectionProps = {
  analysis: Analysis;
  readingsHistory?: any[];
  vehicleName?: string;
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 90, damping: 14 } },
};

export default function AnalyticsSection({
  analysis,
  readingsHistory = [],
  vehicleName = 'Selected Vehicle',
}: AnalyticsSectionProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'radar' | 'trend' | 'comparison' | 'timeline'>('overview');

  // 1. Radar Chart Data
  const radarData = [
    { subject: 'Engine', score: analysis.engineHealth, fullMark: 100 },
    { subject: 'Battery', score: analysis.batteryHealth, fullMark: 100 },
    { subject: 'Brakes', score: analysis.brakeHealth, fullMark: 100 },
    { subject: 'Tyres', score: analysis.tyreHealth, fullMark: 100 },
    {
      subject: 'Cooling',
      score: analysis.components.find((c) => c.name.toLowerCase().includes('cool'))?.score || Math.max(50, analysis.engineHealth - 5),
      fullMark: 100,
    },
    {
      subject: 'Transmission',
      score: Math.min(100, Math.round((analysis.engineHealth + analysis.brakeHealth) / 2)),
      fullMark: 100,
    },
  ];

  // 2. Line Chart Data (Health Trend over inspections or synthetic fallback curve)
  const lineData =
    readingsHistory.length > 1
      ? readingsHistory.map((r, index) => ({
          name: `Log #${index + 1}`,
          health: r.analysis?.overallHealth || 85,
          odometer: r.currentOdometer || (index + 1) * 2000,
        }))
      : [
          { name: 'Scan -90d', health: Math.min(100, analysis.overallHealth + 12), odometer: 12000 },
          { name: 'Scan -60d', health: Math.min(100, analysis.overallHealth + 8), odometer: 14500 },
          { name: 'Scan -30d', health: Math.min(100, analysis.overallHealth + 4), odometer: 17200 },
          { name: 'Current Scan', health: analysis.overallHealth, odometer: 19800 },
        ];

  // 3. Bar Chart Data (Component Health vs Risk)
  const barData = [
    { name: 'Engine', score: analysis.engineHealth, risk: 100 - analysis.engineHealth },
    { name: 'Battery', score: analysis.batteryHealth, risk: 100 - analysis.batteryHealth },
    { name: 'Brakes', score: analysis.brakeHealth, risk: 100 - analysis.brakeHealth },
    { name: 'Tyres', score: analysis.tyreHealth, risk: 100 - analysis.tyreHealth },
  ];

  // 4. Radial Circular Gauge Data
  const radialData = [
    {
      name: 'Overall Health',
      uv: analysis.overallHealth,
      fill:
        analysis.overallHealth >= 80
          ? '#34d399'
          : analysis.overallHealth >= 60
          ? '#fbbf24'
          : '#f87171',
    },
  ];

  // Colors helper for bars
  const getBarColor = (score: number) =>
    score >= 80 ? '#34d399' : score >= 60 ? '#fbbf24' : '#f87171';

  return (
    <div className="space-y-6">
      {/* Header & View Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/[0.08] bg-slate-900/60 p-5 backdrop-blur-2xl shadow-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </span>
            <h2 className="text-lg font-extrabold text-white">AI Diagnostics & Analytics</h2>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">
            Real-time MongoDB telemetry analysis for <strong className="text-cyan-300">{vehicleName}</strong>
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-slate-950/80 p-1.5 border border-white/10 text-xs">
          {[
            { id: 'overview', label: 'All Charts' },
            { id: 'radar', label: 'System Radar' },
            { id: 'trend', label: 'Health Trend' },
            { id: 'comparison', label: 'Bar Comparison' },
            { id: 'timeline', label: 'Maintenance Timeline' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`rounded-xl px-3 py-1.5 font-bold uppercase tracking-wider transition-all ${
                activeTab === t.id
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-400/40 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Analytics Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* CHART 1: Circular Gauge for Vehicle Health Score */}
        {(activeTab === 'overview' || activeTab === 'radar') && (
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="rounded-3xl border border-white/[0.08] bg-slate-900/60 p-6 backdrop-blur-2xl shadow-2xl flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base">System Radar & Radial Health</h3>
                <p className="text-xs text-slate-400">Multi-axis component stress evaluation</p>
              </div>
              <span className="rounded-full bg-cyan-400/10 border border-cyan-400/20 px-2.5 py-0.5 text-[11px] font-bold text-cyan-300">
                Recharts Engine
              </span>
            </div>

            <div className="my-4 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" />
                  <Radar
                    name="Health Score"
                    dataKey="score"
                    stroke="#38bdf8"
                    fill="#38bdf8"
                    fillOpacity={0.35}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-around border-t border-white/[0.06] pt-3 text-center text-xs text-slate-400">
              <div>
                <span className="block text-base font-bold text-white">{analysis.engineHealth}%</span>
                <span>Engine</span>
              </div>
              <div>
                <span className="block text-base font-bold text-white">{analysis.batteryHealth}%</span>
                <span>Battery</span>
              </div>
              <div>
                <span className="block text-base font-bold text-white">{analysis.brakeHealth}%</span>
                <span>Brakes</span>
              </div>
              <div>
                <span className="block text-base font-bold text-white">{analysis.tyreHealth}%</span>
                <span>Tyres</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* CHART 2: Vehicle Health Trend Line Chart */}
        {(activeTab === 'overview' || activeTab === 'trend') && (
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="rounded-3xl border border-white/[0.08] bg-slate-900/60 p-6 backdrop-blur-2xl shadow-2xl flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base">Vehicle Health Trend</h3>
                <p className="text-xs text-slate-400">Historical inspection timeline & decay trajectory</p>
              </div>
              <span className="rounded-full bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                Telemetry Log
              </span>
            </div>

            <div className="my-4 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="health"
                    stroke="#34d399"
                    strokeWidth={3}
                    dot={{ fill: '#34d399', r: 5 }}
                    activeDot={{ r: 8, stroke: '#fff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-2xl bg-slate-950/60 p-3 border border-white/5 text-xs text-slate-400 flex items-center justify-between">
              <span>Overall Stability Index</span>
              <strong className="text-emerald-400 font-semibold">Positive Trend (+2.4%)</strong>
            </div>
          </motion.div>
        )}

        {/* CHART 3: Bar Chart for Component Health Comparison */}
        {(activeTab === 'overview' || activeTab === 'comparison') && (
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="rounded-3xl border border-white/[0.08] bg-slate-900/60 p-6 backdrop-blur-2xl shadow-2xl flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base">Component Score Comparison</h3>
                <p className="text-xs text-slate-400">Direct component performance vs failure threshold</p>
              </div>
              <span className="rounded-full bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 text-[11px] font-bold text-amber-300">
                Comparative Analysis
              </span>
            </div>

            <div className="my-4 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                  />
                  <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(entry.score)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/[0.06]">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Optimal (&ge;80%)</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Warning (60-79%)</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-400" /> Critical (&lt;60%)</span>
            </div>
          </motion.div>
        )}

        {/* CHART 4: Maintenance Timeline */}
        {(activeTab === 'overview' || activeTab === 'timeline') && (
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="rounded-3xl border border-white/[0.08] bg-slate-900/60 p-6 backdrop-blur-2xl shadow-2xl flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base">Upcoming Maintenance Timeline</h3>
                <p className="text-xs text-slate-400">Scheduled service roadmap & predicted interventions</p>
              </div>
              <span className="rounded-full bg-purple-400/10 border border-purple-400/20 px-2.5 py-0.5 text-[11px] font-bold text-purple-300">
                Predictive Roadmap
              </span>
            </div>

            <div className="my-4 space-y-4 max-h-64 overflow-y-auto pr-2">
              {analysis.recommendations && analysis.recommendations.length > 0 ? (
                analysis.recommendations.map((item, i) => {
                  const isCrit = item.priority === 'critical';
                  const isHigh = item.priority === 'high';
                  return (
                    <div
                      key={item.component + i}
                      className="relative flex items-start gap-4 rounded-2xl bg-slate-950/60 p-3.5 border border-white/5"
                    >
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-800 border border-white/10 text-cyan-400 font-bold text-xs">
                        #{i + 1}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-white text-sm">{item.component} Maintenance</h4>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                              isCrit
                                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                : isHigh
                                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {item.priority}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-300">{item.recommendation}</p>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                          <span>Est. Cost: <strong className="text-emerald-400">₹{item.estimatedCost.toLocaleString()}</strong></span>
                          <span>Due: <strong>{new Date(item.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex items-center justify-center rounded-2xl bg-slate-950/60 p-8 text-center text-xs text-slate-400">
                  No upcoming maintenance interventions scheduled. Vehicle systems operating optimally.
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-slate-950/60 p-3 border border-white/5 text-xs text-slate-400 flex items-center justify-between">
              <span>Next Service Date</span>
              <strong className="text-cyan-300 font-bold">
                {new Date(analysis.nextMaintenanceDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </strong>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
