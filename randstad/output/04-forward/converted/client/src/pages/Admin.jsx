import { useState, useEffect } from 'react';
import { Package, ClipboardList, KeyRound, Plus, BarChart3, Activity, Play } from 'lucide-react';
import { api } from '../config';
import KpiCard from '../components/KpiCard';

const TABS = [
  { id: 'catalog', label: 'Catalog', icon: Package },
  { id: 'orders', label: 'Orders', icon: ClipboardList },
  { id: 'config', label: 'Gateways', icon: KeyRound },
  { id: 'activity', label: 'Activity', icon: Activity },
];
const ORDER_NEXT = { AWAITING_PAYMENT: ['CANCELLED'], PAID: ['FULFILLED', 'CANCELLED'], CREATED: ['CANCELLED'], FULFILLED: [], CANCELLED: [] };

function money(c) { return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format((c || 0) / 100); }

function Metrics() {
  const [m, setM] = useState({});
  useEffect(() => {
    ['revenue', 'orders_count', 'low_stock_count', 'new_customers'].forEach((metric) =>
      api(`/api/ops/metrics/business?metric=${metric}&period=month`).then((r) => setM((p) => ({ ...p, [metric]: r.value }))).catch(() => {}));
  }, []);
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
      <KpiCard label="Revenue (mo)" value={money(m.revenue)} icon={BarChart3} />
      <KpiCard label="Orders (mo)" value={m.orders_count ?? '—'} icon={ClipboardList} />
      <KpiCard label="Low stock" value={m.low_stock_count ?? '—'} icon={Package} />
      <KpiCard label="New customers" value={m.new_customers ?? '—'} icon={Plus} />
    </div>
  );
}

function Catalog({ notify }) {
  const [draft, setDraft] = useState({ sku: '', name: '', priceCents: 0, stock: 0, categoryCode: '' });
  const create = async (e) => {
    e.preventDefault();
    try { await api('/api/admin/products', { method: 'POST', body: JSON.stringify(draft) });
      notify('ok', `Product ${draft.sku} created`); setDraft({ sku: '', name: '', priceCents: 0, stock: 0, categoryCode: '' });
    } catch (err) { notify('err', err.message); }
  };
  return (
    <form onSubmit={create} className="card grid grid-cols-2 gap-3">
      <h3 className="font-semibold col-span-2">Create product</h3>
      <input className="border border-gray-200 rounded px-3 py-2" placeholder="SKU" required
        value={draft.sku} onChange={(e) => setDraft({ ...draft, sku: e.target.value })} />
      <input className="border border-gray-200 rounded px-3 py-2" placeholder="Name" required
        value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
      <input className="border border-gray-200 rounded px-3 py-2" type="number" placeholder="Price (cents)"
        value={draft.priceCents} onChange={(e) => setDraft({ ...draft, priceCents: Number(e.target.value) })} />
      <input className="border border-gray-200 rounded px-3 py-2" type="number" placeholder="Stock"
        value={draft.stock} onChange={(e) => setDraft({ ...draft, stock: Number(e.target.value) })} />
      <input className="border border-gray-200 rounded px-3 py-2 col-span-2" placeholder="Category code (electronics/books/home)"
        value={draft.categoryCode} onChange={(e) => setDraft({ ...draft, categoryCode: e.target.value })} />
      <button className="btn btn-primary col-span-2 flex items-center gap-1"><Plus size={16} /> Create</button>
    </form>
  );
}

function Orders({ notify }) {
  const [orders, setOrders] = useState([]);
  const load = () => api('/api/admin/orders').then(setOrders).catch((e) => notify('err', e.message));
  useEffect(load, []);
  const setStatus = async (id, status) => {
    try { await api(`/api/admin/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }); load(); }
    catch (err) { notify('err', err.message); }
  };
  return (
    <div className="card p-0 overflow-hidden">
      <table>
        <thead><tr><th>Order</th><th>Status</th><th>Total</th><th>Action</th></tr></thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>#{o.id}</td>
              <td><span className="pill pill-blue">{o.status}</span></td>
              <td>{money(o.total_cents)}</td>
              <td>
                {(ORDER_NEXT[o.status] || []).map((s) => (
                  <button key={s} className="text-randstad-blue underline mr-2" onClick={() => setStatus(o.id, s)}>{s}</button>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Gateways({ notify }) {
  const [configs, setConfigs] = useState([]);
  const [draft, setDraft] = useState({ gateway: 'stripe', enabled: true, mode: 'authorizeAndCapture', secret: '' });
  const load = () => api('/api/admin/config').then(setConfigs).catch(() => {});
  useEffect(load, []);
  const save = async (e) => {
    e.preventDefault();
    try { await api(`/api/admin/config/${draft.gateway}`, { method: 'PUT', body: JSON.stringify(draft) });
      notify('ok', `Gateway ${draft.gateway} saved (secret encrypted)`); setDraft({ ...draft, secret: '' }); load();
    } catch (err) { notify('err', err.message); }
  };
  return (
    <div className="space-y-4">
      <form onSubmit={save} className="card grid grid-cols-2 gap-3">
        <h3 className="font-semibold col-span-2">Payment gateway</h3>
        <input className="border border-gray-200 rounded px-3 py-2" placeholder="Gateway (stripe)"
          value={draft.gateway} onChange={(e) => setDraft({ ...draft, gateway: e.target.value })} />
        <select className="border border-gray-200 rounded px-3 py-2"
          value={draft.mode} onChange={(e) => setDraft({ ...draft, mode: e.target.value })}>
          {['authorize', 'capture', 'authorizeAndCapture'].map((m) => <option key={m}>{m}</option>)}
        </select>
        <input className="border border-gray-200 rounded px-3 py-2 col-span-2" type="password" placeholder="API secret (stored encrypted)"
          value={draft.secret} onChange={(e) => setDraft({ ...draft, secret: e.target.value })} />
        <label className="flex items-center gap-2 text-sm col-span-2">
          <input type="checkbox" checked={draft.enabled} onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })} /> Enabled
        </label>
        <button className="btn btn-primary col-span-2">Save gateway</button>
      </form>
      <div className="card">
        <h3 className="font-semibold mb-2">Configured gateways</h3>
        {configs.length === 0 && <div className="text-sm text-gray-500">None yet.</div>}
        {configs.map((c) => (
          <div key={c.gateway} className="flex justify-between text-sm border-b border-gray-100 py-2">
            <span>{c.gateway} <span className="pill pill-gray">{c.mode}</span></span>
            <span className="text-gray-500">secret: {c.secretMask || '—'} {c.enabled ? '· enabled' : '· disabled'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityTab({ notify }) {
  const [notes, setNotes] = useState([]);
  const [running, setRunning] = useState(false);
  const load = () => api('/api/admin/notifications').then(setNotes).catch(() => {});
  useEffect(load, []);
  const run = async () => {
    setRunning(true);
    try { const r = await api('/api/admin/heartbeat/run', { method: 'POST', body: '{}' });
      notify('ok', `Heartbeat ran — ${r.lowStock} low-stock, ${r.abandoned} abandoned`); load();
    } catch (e) { notify('err', e.message); } finally { setRunning(false); }
  };
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Notifications &amp; Heartbeat</h3>
        <button className="btn btn-primary flex items-center gap-1" onClick={run} disabled={running}>
          <Play size={16} /> {running ? 'Running…' : 'Run heartbeat'}
        </button>
      </div>
      {notes.length === 0 && <div className="text-sm text-gray-500">No notifications yet.</div>}
      {notes.map((n) => (
        <div key={n.id} className="border-b border-gray-100 py-2 text-sm">
          <span className="pill pill-gray mr-2">{n.type}</span>{n.subject}
          <span className="text-gray-400 ml-2">→ {n.recipient || n.channel}</span>
        </div>
      ))}
    </div>
  );
}

export default function Admin() {
  const [tab, setTab] = useState('catalog');
  const [msg, setMsg] = useState(null);
  const notify = (type, text) => setMsg({ type, text });

  return (
    <div className="max-w-3xl">
      <Metrics />
      <div className="flex gap-2 mb-4">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => { setTab(t.id); setMsg(null); }}
            className={`btn ${tab === t.id ? 'btn-primary' : 'btn-ghost'} flex items-center gap-1`}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>
      {msg && <div className={`pill ${msg.type === 'ok' ? 'pill-green' : 'pill-amber'} block mb-3`}>{msg.text}</div>}
      {tab === 'catalog' && <Catalog notify={notify} />}
      {tab === 'orders' && <Orders notify={notify} />}
      {tab === 'config' && <Gateways notify={notify} />}
      {tab === 'activity' && <ActivityTab notify={notify} />}
    </div>
  );
}
