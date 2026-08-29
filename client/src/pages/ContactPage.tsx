import { useState } from 'react';

function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setStatus('Please complete all fields before sending your inquiry.');
      return;
    }

    try {
      setStatus('Sending your message...');
      await new Promise((resolve) => setTimeout(resolve, 400));
      setName('');
      setEmail('');
      setMessage('');
      setStatus('Your inquiry has been received. We will contact you shortly.');
    } catch {
      setStatus('Unable to send your message at this time. Please try again later.');
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.14),_transparent_24%),linear-gradient(135deg,_#020617_0%,_#0f172a_100%)] px-6 py-10 text-slate-100 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-6 rounded-[32px] border border-white/10 bg-slate-900/70 p-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-400">Contact</p>
          <h1 className="mt-3 text-4xl font-semibold">Talk to the AutoPulse AI team.</h1>
          <p className="mt-4 text-slate-300">Whether you need a demo, want to discuss enterprise rollout, or are interested in partnerships, we would love to hear from you.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 rounded-[24px] border border-white/10 bg-slate-800/70 p-6">
          <input
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-slate-100 outline-none"
            placeholder="Name"
          />
          <input
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-slate-100 outline-none"
            placeholder="Email"
            type="email"
          />
          <textarea
            name="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[140px] w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-slate-100 outline-none"
            placeholder="How can we help?"
          />
          {status && <p className="text-sm text-slate-300">{status}</p>}
          <button className="rounded-full bg-cyan-500 px-5 py-3 font-medium text-slate-950 transition hover:bg-cyan-400" type="submit">
            Send inquiry
          </button>
        </form>
      </div>
    </div>
  );
}

export default ContactPage;
