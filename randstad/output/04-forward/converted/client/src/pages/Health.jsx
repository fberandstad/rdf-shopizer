import { useState, useEffect } from 'react';
import KpiCard from '../components/KpiCard';
import { api } from '../config';

const METRICS = [
  { key: 'orders_count', label: 'Orders (month)', period: 'month' },
  { key: 'revenue', label: 'Revenue (month)', period: 'month', money: true },
  { key: 'new_customers', label: 'New customers (month)', period: 'month' },
  { key: 'low_stock_count', label: 'Low-stock products', period: 'today' },
];

function money(cents) {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format((cents || 0) / 100);
}

export default function Health({ userRole }) {
  const [health, setHealth] = useState(null);
  const [kpis, setKpis] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    api('/api/ops/ready').then(setHealth).catch((e) => setError(e.message));
    if (userRole === 'admin') {
      METRICS.forEach((m) => {
        api(`/api/ops/metrics/business?metric=${m.key}&period=${m.period}`)
          .then((r) => setKpis((prev) => ({ ...prev, [m.key]: r })))
          .catch(() => {});
      });
    }
  }, [userRole]);

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-sm font-semibold text-gray-600 uppercase mb-3">System health</h2>
        {error && <div className="pill pill-amber">{error}</div>}
        {health && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Status" value={health.status} />
            <KpiCard label="PostgreSQL" value={health.components?.postgres || '—'} />
            <KpiCard label="OpenAI" value={health.openai} />
            <KpiCard label="Heartbeat" value={health.heartbeat} sub={`v${health.version}`} />
          </div>
        )}
      </section>

      {userRole === 'admin' && (
        <section>
          <h2 className="text-sm font-semibold text-gray-600 uppercase mb-3">Business metrics</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {METRICS.map((m) => (
              <KpiCard
                key={m.key}
                label={m.label}
                value={kpis[m.key] ? (m.money ? money(kpis[m.key].value) : kpis[m.key].value) : '…'}
              />
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Served via named, allow-listed queries (no free-form SQL) — admin only.
          </p>
        </section>
      )}
    </div>
  );
}
