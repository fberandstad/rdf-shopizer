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

  const inputCls = 'w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-randstad-blue focus:border-randstad-blue outline-none';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white mx-auto mb-3" style={{ background: '#0053A5' }}>
              <ShoppingBag size={24} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">ShopiClaw</h1>
            <p className="text-sm text-gray-500 mt-1">{isRegister ? 'Create your account' : 'Sign in to continue'}</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
                <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                autoFocus={!isRegister} placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input className={inputCls} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                placeholder="••••••••" />
              {isRegister && <p className="text-xs text-gray-400 mt-1">Min 8 characters.</p>}
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-randstad-blue text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[#004080] disabled:opacity-50 transition">
              {loading ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
            </button>
            <button type="button"
              className="w-full text-sm text-randstad-blue hover:underline"
              onClick={() => { setError(null); setMode(isRegister ? 'login' : 'register'); }}>
              {isRegister ? 'Have an account? Sign in' : 'New customer? Create an account'}
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-gray-400 mt-4">Randstad Digital — ShopiClaw Commerce</p>
      </div>
    </div>
  );
}
