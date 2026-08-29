import { FormEvent, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api';

function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setSubmitting(true); setError(''); setSuccess('');
    try {
      const { data } = await api.post(`/auth/${mode === 'login' ? 'login' : 'register'}`, values);
      localStorage.setItem('autopulse-token', data.token);
      localStorage.setItem('autopulse-refresh-token', data.refreshToken);
      localStorage.setItem('autopulse-user', JSON.stringify(data.user));
      const restored = await api.get('/auth/restore');
      localStorage.setItem('autopulse-restored-data', JSON.stringify(restored.data.data));
      setSuccess(mode === 'login' ? 'Signed in successfully. Loading your secure dashboard…' : 'Account created successfully. Loading your secure dashboard…');
      const destination = (location.state as { from?: string } | null)?.from || '/dashboard';
      await new Promise((resolve) => window.setTimeout(resolve, 350));
      navigate(destination, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Unable to continue. Please try again.');
    } finally { setSubmitting(false); }
  };

  return <div className="min-h-screen bg-slate-950 px-6 py-16 text-slate-100">
    <form onSubmit={submit} className="mx-auto max-w-md rounded-[28px] border border-white/10 bg-slate-900 p-8">
      <p className="text-sm uppercase tracking-[.3em] text-cyan-400">AutoPulse AI</p>
      <h1 className="mt-3 text-3xl font-semibold">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
      {mode === 'register' && <label className="mt-6 block text-sm">Name<input required name="name" autoComplete="name" className="input" /></label>}
      <label className="mt-4 block text-sm">Email<input required type="email" name="email" autoComplete="email" className="input" /></label>
      <label className="mt-4 block text-sm">Password<input required minLength={6} type="password" name="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} className="input" /></label>
      {mode === 'register' && <label className="mt-4 block text-sm">Phone <span className="text-slate-500">(optional)</span><input name="phone" className="input" /></label>}
      {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
      {success && <p role="status" className="mt-4 rounded-xl bg-emerald-400/10 p-3 text-sm text-emerald-200">{success}</p>}
      <button disabled={submitting} className="mt-6 w-full rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 disabled:opacity-60">{submitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
      <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccess(''); }} className="mt-4 w-full text-sm text-cyan-300">{mode === 'login' ? 'New here? Create an account' : 'Already have an account? Sign in'}</button>
    </form>
  </div>;
}

export default AuthPage;
