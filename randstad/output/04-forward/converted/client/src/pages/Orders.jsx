import { useState, useEffect } from 'react';
import { ArrowLeft, Package } from 'lucide-react';
import { api } from '../config';

function price(cents, currency = 'EUR') {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency }).format((cents || 0) / 100);
}

const STATUS_STYLE = {
  PAID: 'pill-green', AWAITING_PAYMENT: 'pill-amber', CANCELLED: 'pill-gray', FULFILLED: 'pill-blue',
};

function OrderDetail({ id, onBack }) {
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    api(`/api/orders/${id}`).then(setOrder).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <div className="pill pill-amber">{error}</div>;
  if (!order) return <div className="spinner" />;
  const currency = order.currency || 'EUR';

  return (
    <div className="max-w-2xl">
      <button onClick={onBack} className="btn btn-ghost flex items-center gap-1 mb-4"><ArrowLeft size={16} /> Back to orders</button>
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold">Order #{order.id}</h2>
          <span className={`pill ${STATUS_STYLE[order.status] || 'pill-gray'}`}>{order.status}</span>
        </div>
        <div className="text-sm text-gray-600 mb-3">
          {order.customer?.name} · {order.customer?.email}
        </div>
        <table className="mb-3">
          <thead><tr><th>Product</th><th>Qty</th><th>Line</th></tr></thead>
          <tbody>
            {order.items.map((it) => (
              <tr key={it.sku}>
                <td>{it.name} <span className="text-xs text-gray-500">({it.sku})</span></td>
                <td>{it.quantity}</td>
                <td>{price(it.line_total_cents, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-sm space-y-1 max-w-xs ml-auto">
          <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span>{price(order.subtotal, currency)}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Tax</span><span>{price(order.tax, currency)}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Shipping</span><span>{price(order.shipping, currency)}</span></div>
          <div className="flex justify-between font-bold text-randstad-blue"><span>Total</span><span>{price(order.total, currency)}</span></div>
        </div>
        {order.payment && (
          <div className="text-xs text-gray-500 mt-3">
            Payment: {order.payment.ref} ({order.payment.provider}) — card data never stored.
          </div>
        )}
      </div>
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api('/api/orders').then(setOrders).catch((e) => setError(e.message));
  }, []);

  if (selected) return <OrderDetail id={selected} onBack={() => setSelected(null)} />;
  if (error) return <div className="pill pill-amber">{error}</div>;
  if (!orders) return <div className="spinner" />;

  if (!orders.length) {
    return (
      <div className="card flex flex-col items-center text-gray-500 py-12">
        <Package size={32} className="mb-2" /> No orders yet.
      </div>
    );
  }

  return (
    <div className="card p-0 overflow-hidden max-w-2xl">
      <table>
        <thead><tr><th>Order</th><th>Status</th><th>Total</th><th></th></tr></thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>#{o.id}</td>
              <td><span className={`pill ${STATUS_STYLE[o.status] || 'pill-gray'}`}>{o.status}</span></td>
              <td>{price(o.total, o.currency)}</td>
              <td><button className="text-randstad-blue underline" onClick={() => setSelected(o.id)}>View</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
