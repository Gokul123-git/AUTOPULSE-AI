const plans = [
  { name: 'Starter', price: '₹2,499', description: 'For personal owners who want predictive service reminders and health analytics.', features: ['1 vehicle', 'AI health score', 'Service reminders', 'Basic reports'] },
  { name: 'Growth', price: '₹8,499', description: 'For garages and small fleets that need work orders and performance insights.', features: ['10 vehicles', 'Appointment management', 'Fuel & expense tracking', 'Smart recommendations'] },
  { name: 'Enterprise', price: 'Custom pricing', description: 'For large fleets with API access, advanced analytics, and role-based controls.', features: ['Unlimited vehicles', 'Admin analytics', 'Audit logs', 'Priority support'] },
];

function PricingPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.16),_transparent_24%),linear-gradient(135deg,_#020617_0%,_#0f172a_100%)] px-6 py-10 text-slate-100 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-400">Pricing</p>
          <h1 className="mt-3 text-4xl font-semibold">Choose a plan that scales with your fleet.</h1>
          <p className="mx-auto mt-4 max-w-2xl text-slate-300">From individual owners to enterprise fleets, AutoPulse AI supports every stage of growth with secure automation and premium analytics.</p>
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.name} className="rounded-[28px] border border-white/10 bg-slate-900/70 p-8">
              <h2 className="text-2xl font-semibold">{plan.name}</h2>
              <p className="mt-3 text-slate-300">{plan.description}</p>
              <p className="mt-6 text-4xl font-semibold">{plan.price}</p>
              <p className="mt-2 text-sm text-slate-400">per month</p>
              <ul className="mt-6 space-y-3 text-slate-300">
                {plan.features.map((feature) => <li key={feature}>• {feature}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PricingPage;
