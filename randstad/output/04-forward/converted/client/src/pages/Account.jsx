import { useState, useEffect } from 'react';
import { User, MapPin, Mail, Trash2, Plus } from 'lucide-react';
import { api } from '../config';

const EMPTY_ADDR = { label: '', line1: '', city: '', postalCode: '', country: 'FR', isDefault: false };

export default function Account() {
  const [profile, setProfile] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [draft, setDraft] = useState(EMPTY_ADDR);
  const [msg, setMsg] = useState(null);
  const [newsletter, setNewsletter] = useState('');

  const loadAll = () => {
    api('/api/account/profile').then(setProfile).catch((e) => setMsg({ type: 'err', text: e.message }));
    api('/api/account/addresses').then(setAddresses).catch(() => {});
  };
  useEffect(loadAll, []);

  const saveProfile = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      const p = await api('/api/account/profile', {
        method: 'PUT', body: JSON.stringify({ name: profile.name, phone: profile.phone }),
      });
      setProfile(p); setMsg({ type: 'ok', text: 'Profile saved' });
    } catch (err) { setMsg({ type: 'err', text: err.message }); }
  };

  const addAddress = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      await api('/api/account/addresses', { method: 'POST', body: JSON.stringify(draft) });
      setDraft(EMPTY_ADDR); loadAll();
    } catch (err) { setMsg({ type: 'err', text: err.message }); }
  };

  const removeAddress = async (id) => {
    try { await api(`/api/account/addresses/${id}`, { method: 'DELETE' }); loadAll(); }
    catch (err) { setMsg({ type: 'err', text: err.message }); }
  };

  const subscribe = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      await api('/api/newsletter', { method: 'POST', body: JSON.stringify({ email: newsletter, consent: true }) });
      setNewsletter(''); setMsg({ type: 'ok', text: 'Subscribed to newsletter' });
    } catch (err) { setMsg({ type: 'err', text: err.message }); }
  };

  if (!profile) return <div className="spinner" />;

  return (
    <div className="max-w-3xl space-y-4">
      {msg && <div className={`pill ${msg.type === 'ok' ? 'pill-green' : 'pill-amber'} block`}>{msg.text}</div>}

      <form onSubmit={saveProfile} className="card">
        <h3 className="font-semibold mb-3 flex items-center gap-2"><User size={16} /> Profile</h3>
        <label className="block text-sm text-gray-600 mb-1">Name</label>
        <input className="w-full border border-gray-200 rounded px-3 py-2 mb-3" required
          value={profile.name || ''} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
        <label className="block text-sm text-gray-600 mb-1">Email</label>
        <input className="w-full border border-gray-200 rounded px-3 py-2 mb-3 bg-gray-50" value={profile.email} disabled />
        <label className="block text-sm text-gray-600 mb-1">Phone</label>
        <input className="w-full border border-gray-200 rounded px-3 py-2 mb-3"
          value={profile.phone || ''} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
        <button className="btn btn-primary">Save profile</button>
      </form>

      <div className="card">
        <h3 className="font-semibold mb-3 flex items-center gap-2"><MapPin size={16} /> Addresses</h3>
        {addresses.length === 0 && <div className="text-sm text-gray-500 mb-3">No addresses yet.</div>}
        {addresses.map((a) => (
          <div key={a.id} className="flex items-center justify-between border-b border-gray-100 py-2 text-sm">
            <div>
              {a.label && <span className="pill pill-blue mr-2">{a.label}</span>}
              {a.line1}, {a.city} {a.postal_code} ({a.country})
              {a.is_default && <span className="pill pill-green ml-2">default</span>}
            </div>
            <button className="text-red-500" onClick={() => removeAddress(a.id)}><Trash2 size={16} /></button>
          </div>
        ))}
        <form onSubmit={addAddress} className="mt-4 grid grid-cols-2 gap-3">
          <input className="border border-gray-200 rounded px-3 py-2" placeholder="Label (Home/Work)"
            value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
          <input className="border border-gray-200 rounded px-3 py-2" placeholder="Address" required
            value={draft.line1} onChange={(e) => setDraft({ ...draft, line1: e.target.value })} />
          <input className="border border-gray-200 rounded px-3 py-2" placeholder="City" required
            value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} />
          <input className="border border-gray-200 rounded px-3 py-2" placeholder="Postal code" required
            value={draft.postalCode} onChange={(e) => setDraft({ ...draft, postalCode: e.target.value })} />
          <input className="border border-gray-200 rounded px-3 py-2" placeholder="Country (FR)" maxLength={2}
            value={draft.country} onChange={(e) => setDraft({ ...draft, country: e.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={draft.isDefault}
              onChange={(e) => setDraft({ ...draft, isDefault: e.target.checked })} /> Default
          </label>
          <button className="btn btn-primary flex items-center gap-1 col-span-2"><Plus size={16} /> Add address</button>
        </form>
      </div>

      <form onSubmit={subscribe} className="card">
        <h3 className="font-semibold mb-3 flex items-center gap-2"><Mail size={16} /> Newsletter</h3>
        <div className="flex gap-3">
          <input className="flex-1 border border-gray-200 rounded px-3 py-2" type="email" placeholder="your@email.com" required
            value={newsletter} onChange={(e) => setNewsletter(e.target.value)} />
          <button className="btn btn-primary">Subscribe</button>
        </div>
        <div className="text-xs text-gray-500 mt-2">You consent to receive marketing emails. Unsubscribe anytime.</div>
      </form>
    </div>
  );
}
