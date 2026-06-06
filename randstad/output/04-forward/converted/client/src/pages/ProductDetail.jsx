import { useState, useEffect } from 'react';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { api } from '../config';
import { useCart } from '../cart/CartContext';

function price(cents, currency = 'EUR') {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency }).format((cents || 0) / 100);
}

export default function ProductDetail({ sku, onBack }) {
  const { add } = useCart();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const onAdd = async () => {
    setAdding(true); setFeedback(null);
    const res = await add(sku, qty);
    setFeedback(res.error ? { type: 'error', msg: res.error } : { type: 'ok', msg: 'Added to cart' });
    setAdding(false);
  };

  useEffect(() => {
    setLoading(true); setError(null);
    api(`/api/catalog/products/${encodeURIComponent(sku)}`)
      .then(setProduct).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [sku]);

  if (loading) return <div className="spinner" />;
  if (error) return <div className="pill pill-amber">{error}</div>;
  if (!product) return null;

  const attrs = product.attributes && typeof product.attributes === 'object'
    ? Object.entries(product.attributes) : [];

  return (
    <div className="max-w-3xl">
      <button onClick={onBack} className="btn btn-ghost flex items-center gap-1 mb-4">
        <ArrowLeft size={16} /> Back to catalog
      </button>
      <div className="card">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/3 h-40 rounded bg-gradient-to-br from-randstad-blue/10 to-randstad-cyan/10" />
          <div className="flex-1">
            {product.category_name && <span className="pill pill-blue">{product.category_name}</span>}
            <h2 className="text-2xl font-bold text-gray-900 mt-2">{product.name}</h2>
            <div className="text-sm text-gray-500 mb-3">SKU: {product.sku}</div>
            <div className="text-2xl font-bold text-randstad-blue mb-2">
              {price(product.price_cents, product.currency)}
            </div>
            <span className={`pill ${product.stock > 0 ? 'pill-green' : 'pill-gray'}`}>
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </span>
            {product.description && <p className="text-gray-600 mt-4">{product.description}</p>}
            {attrs.length > 0 && (
              <div className="mt-4">
                <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Attributes</div>
                {attrs.map(([k, v]) => (
                  <span key={k} className="pill pill-gray">{k}: {String(v)}</span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3 mt-6">
              <div className="flex items-center border border-gray-200 rounded">
                <button className="px-3 py-2" onClick={() => setQty((q) => Math.max(1, q - 1))}>-</button>
                <span className="w-8 text-center">{qty}</span>
                <button className="px-3 py-2" onClick={() => setQty((q) => q + 1)}>+</button>
              </div>
              <button
                className={`btn btn-primary flex items-center gap-2 ${(adding || product.stock <= 0) ? 'opacity-60 cursor-not-allowed' : ''}`}
                onClick={onAdd}
                disabled={adding || product.stock <= 0}
              >
                <ShoppingCart size={16} /> {adding ? 'Adding…' : 'Add to cart'}
              </button>
            </div>
            {feedback && (
              <div className={`pill ${feedback.type === 'ok' ? 'pill-green' : 'pill-amber'} mt-3`}>{feedback.msg}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
