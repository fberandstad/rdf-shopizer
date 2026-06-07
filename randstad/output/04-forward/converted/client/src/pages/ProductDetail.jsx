import { useState, useEffect } from 'react';
import { ArrowLeft, ShoppingCart, Star, Download } from 'lucide-react';
import { api, API_BASE } from '../config';
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
  const [reviews, setReviews] = useState(null);
  const [draft, setDraft] = useState({ rating: 5, title: '', body: '' });
  const [reviewMsg, setReviewMsg] = useState(null);

  const loadReviews = () => {
    api(`/api/catalog/products/${encodeURIComponent(sku)}/reviews`).then(setReviews).catch(() => {});
  };

  const submitReview = async (e) => {
    e.preventDefault();
    setReviewMsg(null);
    try {
      await api(`/api/catalog/products/${encodeURIComponent(sku)}/reviews`,
        { method: 'POST', body: JSON.stringify(draft) });
      setReviewMsg({ type: 'ok', msg: 'Review submitted' });
      loadReviews();
    } catch (err) { setReviewMsg({ type: 'error', msg: err.message }); }
  };

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
    loadReviews();
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
            {product.digital && (
              <a className="btn btn-ghost flex items-center gap-2 mt-3 w-max"
                href={`${API_BASE}/api/files/${encodeURIComponent(product.sku)}`}>
                <Download size={16} /> Download (purchase required)
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="card mt-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Star size={16} /> Reviews
          {reviews?.average != null && (
            <span className="pill pill-blue">{reviews.average.toFixed(1)} ★ ({reviews.count})</span>
          )}
        </h3>
        {reviews?.reviews?.length ? reviews.reviews.map((r, i) => (
          <div key={i} className="border-b border-gray-100 py-2">
            <div className="text-sm font-medium">{'★'.repeat(r.rating)}<span className="text-gray-300">{'★'.repeat(5 - r.rating)}</span>
              {r.title && <span className="ml-2">{r.title}</span>}</div>
            {r.body && <div className="text-sm text-gray-600">{r.body}</div>}
            <div className="text-xs text-gray-400">by {r.author}</div>
          </div>
        )) : <div className="text-sm text-gray-500 mb-2">No reviews yet. Be the first!</div>}

        <form onSubmit={submitReview} className="mt-3 flex flex-col gap-2 max-w-md">
          <select className="border border-gray-200 rounded px-3 py-2"
            value={draft.rating} onChange={(e) => setDraft({ ...draft, rating: Number(e.target.value) })}>
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>)}
          </select>
          <input className="border border-gray-200 rounded px-3 py-2" placeholder="Title (optional)"
            value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          <textarea className="border border-gray-200 rounded px-3 py-2" placeholder="Your review"
            value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
          <button className="btn btn-primary w-max">Submit review</button>
          {reviewMsg && <div className={`pill ${reviewMsg.type === 'ok' ? 'pill-green' : 'pill-amber'}`}>{reviewMsg.msg}</div>}
        </form>
      </div>
    </div>
  );
}
