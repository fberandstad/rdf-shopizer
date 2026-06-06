import { useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { api } from '../config';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('admin@randstad.fr');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null); setLoading(true);
    try {
      const { user } = await api('/auth/login', {
        method: 'POST', body: JSON.stringify({ email, password }),
      });
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
        {error && <div className="pill pill-amber mb-3 block">{error}</div>}
        <button className="btn btn-primary w-full" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
