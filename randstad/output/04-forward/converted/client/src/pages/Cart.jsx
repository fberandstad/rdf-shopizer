import { Trash2, Minus, Plus, ShoppingCart } from 'lucide-react';
import { useCart } from '../cart/CartContext';

function price(cents, currency = 'EUR') {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency }).format((cents || 0) / 100);
}

export default function Cart({ onNavigate }) {
  const { cart, update, remove } = useCart();

  if (!cart) return <div className="spinner" />;
  const currency = cart.currency || 'EUR';

  if (!cart.items?.length) {
    return (
      <div className="card flex flex-col items-center text-gray-500 py-12">
        <ShoppingCart size={32} className="mb-2" />
        Your cart is empty.
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div className="card p-0 overflow-hidden">
        <table>
          <thead>
            <tr><th>Product</th><th>Unit</th><th>Qty</th><th>Line</th><th></th></tr>
          </thead>
          <tbody>
            {cart.items.map((it) => (
              <tr key={it.id}>
                <td>
                  <div className="font-medium text-gray-900">{it.name}</div>
                  <div className="text-xs text-gray-500">{it.sku}</div>
                </td>
                <td>{price(it.unit_price_cents, currency)}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <button className="btn-ghost p-1" onClick={() => update(it.id, Math.max(0, it.quantity - 1))} title="Decrease">
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center">{it.quantity}</span>
                    <button className="btn-ghost p-1" onClick={() => update(it.id, it.quantity + 1)} title="Increase">
                      <Plus size={14} />
                    </button>
                  </div>
                </td>
                <td className="font-medium">{price(it.line_total_cents, currency)}</td>
                <td>
                  <button className="btn-ghost p-1 text-red-600" onClick={() => remove(it.id)} title="Remove">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card max-w-xs ml-auto">
        <div className="flex justify-between text-sm mb-1"><span className="text-gray-600">Subtotal</span><span>{price(cart.subtotal, currency)}</span></div>
        <div className="flex justify-between text-sm mb-1"><span className="text-gray-600">Tax</span><span>{price(cart.tax, currency)}</span></div>
        <div className="flex justify-between text-sm mb-2"><span className="text-gray-600">Shipping</span><span>{price(cart.shipping, currency)}</span></div>
        <div className="flex justify-between font-bold text-randstad-blue border-t border-gray-200 pt-2">
          <span>Total</span><span>{price(cart.total, currency)}</span>
        </div>
        <button className="btn btn-primary w-full mt-4" onClick={() => onNavigate && onNavigate('checkout')}>
          Checkout
        </button>
      </div>
    </div>
  );
}
