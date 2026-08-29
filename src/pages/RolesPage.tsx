const roles = [
  { name: 'Vehicle owner', description: 'Personal dashboards, maintenance reminders, compliance tracking, and AI-powered repair recommendations.' },
  { name: 'Service center', description: 'Appointment control, mechanic assignment, service status updates, digital invoices, and customer history.' },
  { name: 'Fleet manager', description: 'Multi-vehicle performance monitoring, driver oversight, fuel analytics, and maintenance risk forecasting.' },
  { name: 'Administrator', description: 'System oversight across users, vehicles, appointments, reports, AI models, logs, and permissions.' },
];

function RolesPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.12),_transparent_24%),linear-gradient(135deg,_#020617_0%,_#0f172a_100%)] px-6 py-10 text-slate-100 lg:px-8">
      <div className="mx-auto max-w-6xl rounded-[32px] border border-white/10 bg-slate-900/70 p-8">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-400">User roles</p>
        <h1 className="mt-3 text-4xl font-semibold">Role-based experiences for every stakeholder.</h1>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {roles.map((role) => (
            <div key={role.name} className="rounded-[24px] border border-white/10 bg-slate-800/70 p-6">
              <h2 className="text-xl font-semibold">{role.name}</h2>
              <p className="mt-3 text-slate-300">{role.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RolesPage;
