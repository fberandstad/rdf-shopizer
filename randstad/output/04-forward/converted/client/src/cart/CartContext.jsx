import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../config';

const CartCtx = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(null);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try { setCart(await api('/api/cart')); }
    catch (e) { setError(e.message); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Returns { ok } or { error } so callers can surface validation messages (RULE-0001..0007).
  const add = useCallback(async (sku, quantity = 1, options = {}) => {
    try {
      setCart(await api('/api/cart/items', {
        method: 'POST', body: JSON.stringify({ sku, quantity, options }),
      }));
      setError(null);
      return { ok: true };
    } catch (e) { return { error: e.message }; }
  }, []);

  const update = useCallback(async (itemId, quantity) => {
    try {
      setCart(await api(`/api/cart/items/${itemId}`, {
        method: 'PATCH', body: JSON.stringify({ quantity }),
      }));
      return { ok: true };
    } catch (e) { return { error: e.message }; }
  }, []);

  const remove = useCallback(async (itemId) => {
    try {
      setCart(await api(`/api/cart/items/${itemId}`, { method: 'DELETE' }));
      return { ok: true };
    } catch (e) { return { error: e.message }; }
  }, []);

  const count = cart?.count || 0;

  return (
    <CartCtx.Provider value={{ cart, count, error, refresh, add, update, remove }}>
      {children}
    </CartCtx.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
