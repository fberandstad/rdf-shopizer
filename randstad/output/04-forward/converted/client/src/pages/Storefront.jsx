import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useCopilotReadable } from '@copilotkit/react-core';
import { api } from '../config';
import ProductDetail from './ProductDetail';

function price(cents, currency = 'EUR') {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency }).format((cents || 0) / 100);
}

export default function Storefront() {
  const [q, setQ] = useState('');
  const [categories, setCategories] = useState([]);
  const [activeCat, setActiveCat] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedSku, setSelectedSku] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async (query = '', categoryCode = null) => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (categoryCode) params.set('categoryId', categoryCode);
      const qs = params.toString();
      setProducts(await api(`/api/catalog/search${qs ? `?${qs}` : ''}`));
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    api('/api/catalog/categories').then(setCategories).catch(() => {});
  }, []);

  // Make the visible catalog available to ShopiClaw (agentic context, FS-0001).
  useCopilotReadable({
    description: 'Products currently visible to the user in the storefront',
    value: products.map((p) => ({ sku: p.sku, name: p.name, price_cents: p.price_cents, stock: p.stock })),
  });
  useCopilotReadable({
    description: 'Active catalog category filter',
    value: activeCat || 'all',
  });

  const pickCategory = (code) => {
    const next = activeCat === code ? null : code;
    setActiveCat(next);
    load(q, next);
  };

  if (selectedSku) {
    return <ProductDetail sku={selectedSku} onBack={() => setSelectedSku(null)} />;
  }

  return (
    <div>
      <form
        onSubmit={(e) => { e.preventDefault(); load(q, activeCat); }}
        className="flex items-center gap-2 mb-4 max-w-md"
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

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => pickCategory(c.code)}
              className={`pill ${activeCat === c.code ? 'pill-blue' : 'pill-gray'}`}
            >
              {c.name}{typeof c.product_count === 'number' ? ` (${c.product_count})` : ''}
            </button>
          ))}
        </div>
      )}

      {loading && <div className="spinner" />}
      {error && <div className="pill pill-amber">{error}</div>}

      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedSku(p.sku)}
              className="product-card p-4 text-left"
            >
              <div className="h-28 rounded bg-gradient-to-br from-randstad-blue/10 to-randstad-cyan/10 mb-3" />
              <div className="font-medium text-gray-900">{p.name}</div>
              <div className="text-xs text-gray-500 mb-2">{p.sku}</div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-randstad-blue">{price(p.price_cents, p.currency)}</span>
                <span className={`pill ${p.stock > 0 ? 'pill-green' : 'pill-gray'}`}>
                  {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
                </span>
              </div>
            </button>
          ))}
          {products.length === 0 && <div className="text-gray-500">No products found.</div>}
        </div>
      )}
    </div>
  );
}
