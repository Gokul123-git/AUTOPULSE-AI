const faqs = [
  { question: 'What does AutoPulse AI predict?', answer: 'It estimates risks for engine, battery, brake wear, tyre wear, transmission issues, cooling system health, oil replacement timing, fuel usage, maintenance costs, and remaining useful life.' },
  { question: 'Can service centers use it?', answer: 'Yes. Service centers can manage appointments, update repair status, upload reports, and oversee spare parts inventory from a dedicated workflow.' },
  { question: 'Is the platform suitable for fleets?', answer: 'Absolutely. Fleet managers can monitor vehicles, drivers, expenses, fuel trends, and upcoming services from one analytics layer.' },
];

function FaqPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.14),_transparent_24%),linear-gradient(135deg,_#020617_0%,_#0f172a_100%)] px-6 py-10 text-slate-100 lg:px-8">
      <div className="mx-auto max-w-5xl rounded-[32px] border border-white/10 bg-slate-900/70 p-8">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-400">FAQ</p>
        <h1 className="mt-3 text-4xl font-semibold">Everything you need to know before getting started.</h1>
        <div className="mt-8 space-y-4">
          {faqs.map((item) => (
            <div key={item.question} className="rounded-[24px] border border-white/10 bg-slate-800/70 p-5">
              <h2 className="text-lg font-semibold">{item.question}</h2>
              <p className="mt-2 text-slate-300">{item.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default FaqPage;
