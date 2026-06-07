import { useState, useEffect } from 'react';
import { CreditCard, ShieldCheck, ArrowLeft, Truck } from 'lucide-react';
import { api } from '../config';
import { useCart } from '../cart/CartContext';

function price(cents, currency = 'EUR') {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency }).format((cents || 0) / 100);
}

export default function Checkout({ onNavigate }) {
  const { cart, refresh } = useCart();
  const [customer, setCustomer] = useState({ name: '', email: '' });
  const [address, setAddress] = useState({ line1: '', city: '', postalCode: '', country: 'FR' });
  // Tokenized payment only — this is a provider token / hosted-field nonce, NEVER a card number.
  const [paymentToken, setPaymentToken] = useState('tok_test_visa');
  const [methods, setMethods] = useState([]);
  const [shipMethod, setShipMethod] = useState('STANDARD');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(null);

  const currency = cart?.currency || 'EUR';
  const empty = !cart?.items?.length;

  // Load server-authoritative shipping methods (FS-0003, TEST-0010).
  useEffect(() => {
    api('/api/checkout/shipping')
      .then((r) => {
        setMethods(r.options || []);
        if (r.options?.length) setShipMethod(r.options[0].code);
      })
      .catch(() => {});
  }, []);

  // Totals reflect the chosen method's cost; the server recomputes authoritatively on /order.
  const shippingCents = methods.find((m) => m.code === shipMethod)?.cents ?? (cart?.shipping || 0);
  const totalCents = (cart?.subtotal || 0) + (cart?.tax || 0) + shippingCents;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const order = await api('/api/checkout/order', {
        method: 'POST', body: JSON.stringify({ customer, shipAddress: address, shippingMethod: shipMethod }),
      });
      const paid = await api('/api/checkout/pay', {
        method: 'POST', body: JSON.stringify({ orderId: order.id, paymentToken }),
      });
      await refresh();
      setDone(paid);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  if (done) {
    return (
      <div className="card max-w-lg">
        <div className="flex items-center gap-2 text-green-600 mb-2"><ShieldCheck /> <span className="font-bold">Order confirmed</span></div>
        <div className="text-sm text-gray-600 mb-1">Order #{done.id} — status <strong>{done.status}</strong></div>
        <div className="text-sm text-gray-600 mb-1">Total {price(done.total, done.currency)}</div>
        <div className="text-sm text-gray-600 mb-4">Payment {done.payment?.ref} ({done.payment?.provider})</div>
        <button className="btn btn-primary" onClick={() => onNavigate('orders')}>View my orders</button>
      </div>
    );
  }

  if (empty) {
    return (
      <div className="card text-gray-500">
        Your cart is empty. <button className="text-randstad-blue underline" onClick={() => onNavigate('storefront')}>Browse products</button>.
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <button onClick={() => onNavigate('cart')} className="btn btn-ghost flex items-center gap-1 mb-4"><ArrowLeft size={16} /> Back to cart</button>
      <form onSubmit={submit} className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-semibold mb-3">Customer</h3>
          <input className="w-full border border-gray-200 rounded px-3 py-2 mb-3" placeholder="Full name" required
            value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />
          <input className="w-full border border-gray-200 rounded px-3 py-2 mb-3" type="email" placeholder="Email" required
            value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} />
          <h3 className="font-semibold mb-3 mt-2">Shipping address</h3>
          <input className="w-full border border-gray-200 rounded px-3 py-2 mb-3" placeholder="Address" required
            value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} />
          <div className="flex gap-3">
            <input className="w-1/2 border border-gray-200 rounded px-3 py-2 mb-3" placeholder="City" required
              value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
            <input className="w-1/2 border border-gray-200 rounded px-3 py-2 mb-3" placeholder="Postal code" required
              value={address.postalCode} onChange={(e) => setAddress({ ...address, postalCode: e.target.value })} />
          </div>
          <h3 className="font-semibold mb-2 mt-2 flex items-center gap-1"><Truck size={16} /> Shipping method</h3>
          <select className="w-full border border-gray-200 rounded px-3 py-2"
            value={shipMethod} onChange={(e) => setShipMethod(e.target.value)}>
            {methods.map((m) => (
              <option key={m.code} value={m.code}>
                {m.label} — {m.cents ? price(m.cents, currency) : 'Free'}
              </option>
            ))}
          </select>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-3">Payment</h3>
          <label className="block text-sm text-gray-600 mb-1 flex items-center gap-1"><CreditCard size={14} /> Payment token</label>
          <input className="w-full border border-gray-200 rounded px-3 py-2 mb-1"
            value={paymentToken} onChange={(e) => setPaymentToken(e.target.value)} />
          <div className="text-xs text-gray-500 mb-4">
            Tokenized payment only — never a card number. Try <code>tok_decline</code> to simulate a decline.
          </div>

          <div className="border-t border-gray-200 pt-3 text-sm">
            <div className="flex justify-between mb-1"><span className="text-gray-600">Subtotal</span><span>{price(cart.subtotal, currency)}</span></div>
            <div className="flex justify-between mb-1"><span className="text-gray-600">Tax</span><span>{price(cart.tax, currency)}</span></div>
            <div className="flex justify-between mb-2"><span className="text-gray-600">Shipping</span><span>{shippingCents ? price(shippingCents, currency) : 'Free'}</span></div>
            <div className="flex justify-between font-bold text-randstad-blue"><span>Total</span><span>{price(totalCents, currency)}</span></div>
          </div>

          {error && <div className="pill pill-amber mt-3 block">{error}</div>}
          <button className="btn btn-primary w-full mt-4" disabled={busy}>
            {busy ? 'Processing…' : `Pay ${price(totalCents, currency)}`}
          </button>
        </div>
      </form>
    </div>
  );
}
