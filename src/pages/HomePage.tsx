import { Link } from 'react-router-dom';
import carHero from '../assets/autopulse-car-hero.png';

const featureCards = [
  { title: 'Predictive health scoring', text: 'Use AI to estimate failure risk across the drivetrain, battery, brakes, tyres, and transmission.' },
  { title: 'Maintenance automation', text: 'Schedule services, track bills, and receive smart recommendations before expensive breakdowns occur.' },
  { title: 'Fleet intelligence', text: 'Monitor vehicles, drivers, fuel trends, and service costs across every operating unit from one portal.' },
];

const roleCards = [
  { title: 'Vehicle owners', text: 'Protect personal vehicles with proactive alerts and a digital service book.' },
  { title: 'Service centers', text: 'Accept appointments, manage mechanics, and close repair jobs with digital invoicing.' },
  { title: 'Fleet managers', text: 'Optimize operations with health trends, driver insights, and maintenance forecasting.' },
];

function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto max-w-7xl px-6 pb-20 pt-8 lg:px-8">
        <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-slate-900 p-8 shadow-2xl shadow-cyan-950/30 xl:p-12">
          <img src={carHero} alt="Premium electric car on a city road" className="absolute inset-0 h-full w-full object-cover opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/10" />
          <div className="relative max-w-2xl">
            <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-sm text-cyan-300">Enterprise-grade AI vehicle health platform</span>
            <h1 className="mt-5 text-4xl font-semibold leading-tight sm:text-5xl">Prevent unexpected vehicle failures with confidence.</h1>
            <p className="mt-5 max-w-2xl text-lg text-slate-300">AutoPulse AI combines predictive analytics, maintenance automation, fleet oversight, and service center workflows into one modern operating system.</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/dashboard" className="rounded-full bg-cyan-500 px-5 py-3 font-medium text-slate-950 transition hover:bg-cyan-400">View live dashboard</Link>
              <Link to="/pricing" className="rounded-full border border-white/15 px-5 py-3 font-medium text-slate-200 transition hover:bg-white/10">Explore pricing</Link>
            </div>
          </div>
          <div className="rounded-[28px] border border-cyan-400/20 bg-slate-800/70 p-6">
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
              <p className="text-sm text-slate-400">Current fleet outlook</p>
              <p className="mt-3 text-3xl font-semibold">94% healthy</p>
              <div className="mt-4 h-3 rounded-full bg-slate-800">
                <div className="h-3 w-[94%] rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500" />
              </div>
              <div className="mt-5 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-800/70 p-3">⚡ 6 predicted maintenance tasks</div>
                <div className="rounded-2xl bg-slate-800/70 p-3">💸 Estimated savings: $2,400/month</div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-14 grid gap-6 lg:grid-cols-3">
          {featureCards.map((card) => (
            <div key={card.title} className="rounded-[28px] border border-white/10 bg-slate-900/60 p-7 shadow-lg shadow-cyan-950/10">
              <h3 className="text-xl font-semibold">{card.title}</h3>
              <p className="mt-3 text-slate-300">{card.text}</p>
            </div>
          ))}
        </section>

        <section className="mt-14 rounded-[32px] border border-white/10 bg-slate-900/60 p-8">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-400">Built for every role</p>
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {roleCards.map((card) => (
              <div key={card.title} className="rounded-[24px] border border-white/10 bg-slate-800/70 p-6">
                <h3 className="text-xl font-semibold">{card.title}</h3>
                <p className="mt-3 text-slate-300">{card.text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default HomePage;
