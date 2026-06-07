import { useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { api } from '../config';

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('admin@randstad.fr');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const isRegister = mode === 'register';

  const submit = async (e) => {
    e.preventDefault();
    setError(null); setLoading(true);
    try {
      const path = isRegister ? '/auth/register' : '/auth/login';
      const body = isRegister ? { email, password, name } : { email, password };
      const { user } = await api(path, { method: 'POST', body: JSON.stringify(body) });
      onLogin(user);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <form onSubmit={submit} className="card w-full max-w-sm">
        <div className="flex items-center gap-2 mb-6 text-randstad-blue">
          <ShoppingBag size={28} />
          <span className="text-2xl font-bold">ShopiClaw</span>
        </div>
        {isRegister && (
          <>
            <label className="block text-sm text-gray-600 mb-1">Full name</label>
            <input
              className="w-full border border-gray-200 rounded px-3 py-2 mb-4"
              value={name} onChange={(e) => setName(e.target.value)} required
            />
          </>
        )}
        <label className="block text-sm text-gray-600 mb-1">Email</label>
        <input
          className="w-full border border-gray-200 rounded px-3 py-2 mb-4"
          type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
        />
        <label className="block text-sm text-gray-600 mb-1">Password</label>
        <input
          className="w-full border border-gray-200 rounded px-3 py-2 mb-4"
          type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
        />
        {isRegister && (
          <div className="text-xs text-gray-500 mb-3">Password must be at least 8 characters.</div>
        )}
        {error && <div className="pill pill-amber mb-3 block">{error}</div>}
        <button className="btn btn-primary w-full" disabled={loading}>
          {loading ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
        </button>
        <button
          type="button"
          className="text-sm text-randstad-blue underline w-full mt-3"
          onClick={() => { setError(null); setMode(isRegister ? 'login' : 'register'); }}
        >
          {isRegister ? 'Have an account? Sign in' : 'New customer? Create an account'}
        </button>
      </form>
    </div>
  );
}
