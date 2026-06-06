import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { api } from '../config';

function price(cents, currency = 'EUR') {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency }).format((cents || 0) / 100);
}

export default function Storefront() {
  const [q, setQ] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async (query = '') => {
    setLoading(true); setError(null);
    try {
      const rows = await api(`/api/catalog/search${query ? `?q=${encodeURIComponent(query)}` : ''}`);
      setProducts(rows);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      <form
        onSubmit={(e) => { e.preventDefault(); load(q); }}
        className="flex items-center gap-2 mb-6 max-w-md"
      >
        <div className="flex items-center gap-2 flex-1 border border-gray-200 rounded px-3 py-2 bg-white">
          <Search size={16} className="text-gray-400" />
          <input
            className="flex-1 outline-none bg-transparent"
            placeholder="Search products..."
            value={q} onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <button className="btn btn-primary">Search</button>
      </form>

      {loading && <div className="spinner" />}
      {error && <div className="pill pill-amber">{error}</div>}

      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <div key={p.id} className="product-card p-4">
              <div className="h-28 rounded bg-gradient-to-br from-randstad-blue/10 to-randstad-cyan/10 mb-3" />
              <div className="font-medium text-gray-900">{p.name}</div>
              <div className="text-xs text-gray-500 mb-2">{p.sku}</div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-randstad-blue">{price(p.price_cents, p.currency)}</span>
                <span className={`pill ${p.stock > 0 ? 'pill-green' : 'pill-gray'}`}>
                  {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
                </span>
              </div>
            </div>
          ))}
          {products.length === 0 && <div className="text-gray-500">No products found.</div>}
        </div>
      )}
    </div>
  );
}
