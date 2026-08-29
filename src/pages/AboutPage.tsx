function AboutPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.16),_transparent_24%),linear-gradient(135deg,_#020617_0%,_#0f172a_100%)] px-6 py-10 text-slate-100 lg:px-8">
      <div className="mx-auto max-w-6xl rounded-[32px] border border-white/10 bg-slate-900/70 p-8 shadow-xl shadow-cyan-950/20">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-400">About AutoPulse AI</p>
        <h1 className="mt-3 text-4xl font-semibold">Designed to make every vehicle service smarter and safer.</h1>
        <p className="mt-5 max-w-3xl text-lg text-slate-300">AutoPulse AI unifies predictive maintenance, service execution, cost tracking, performance analytics, and fleet management into a premium product experience for modern automotive operations.</p>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-[24px] border border-white/10 bg-slate-800/70 p-6">
            <h2 className="text-xl font-semibold">Why it matters</h2>
            <p className="mt-3 text-slate-300">Preventing downtime and extending asset life requires timely insight. Our platform turns maintenance history and vehicle telemetry into actionable next steps.</p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-slate-800/70 p-6">
            <h2 className="text-xl font-semibold">What makes it premium</h2>
            <p className="mt-3 text-slate-300">Role-based access, polished dashboards, forecasting, secure APIs, reporting, and a clean experience are all built into the product from the start.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AboutPage;
