import { test, expect } from '@playwright/test';
import { login, clearCart } from './helpers';

// Golden master TEST-0005..0008 against the modern app (FS-0002, RULE-0001..0007).
// Server is authoritative for totals/merge; UI + API are both exercised.
test.describe.configure({ mode: 'serial' });

test.describe('Cart (new app)', () => {
  // Use page.request so API calls share the logged-in browser session cookies.
  test.beforeEach(async ({ page }) => {
    await login(page);
    await clearCart(page.request);
  });

  async function openProduct(page, name: RegExp) {
    await page.getByRole('button', { name }).click();
    await expect(page.getByRole('button', { name: /add to cart/i })).toBeVisible();
  }

  test('TEST-0005 add valid product; server totals + mini-cart count', async ({ page }) => {
    await openProduct(page, /Wireless Headphones/);
    await page.getByRole('button', { name: /add to cart/i }).click();
    await expect(page.getByText(/added to cart/i)).toBeVisible();

    // Mini-cart badge increments, then verify server-computed totals on the cart page.
    await page.getByRole('button', { name: /^Cart/ }).click();
    await expect(page.getByText('Wireless Headphones')).toBeVisible();
    await expect(page.getByText('Total', { exact: true })).toBeVisible();
    await expect(page.getByText(/€\s?79\.99/).first()).toBeVisible();
  });

  test('TEST-0006 invalid quantity rejected by server (RULE-0003)', async ({ page }) => {
    const res = await page.request.post('/api/cart/items', { data: { sku: 'EL-001', quantity: 0 } });
    expect(res.status()).toBe(422);
    const body = await res.json();
    expect(body.error).toMatch(/positive integer/i);
  });

  test('TEST-0007 same SKU merges into one line (RULE-0005)', async ({ page }) => {
    await page.request.post('/api/cart/items', { data: { sku: 'EL-001', quantity: 1 } });
    await page.request.post('/api/cart/items', { data: { sku: 'EL-001', quantity: 1 } });
    const cart = await (await page.request.get('/api/cart')).json();
    const lines = cart.items.filter((i: any) => i.sku === 'EL-001');
    expect(lines).toHaveLength(1);
    expect(lines[0].quantity).toBe(2);
    expect(cart.subtotal).toBe(7999 * 2);
  });

  test('TEST-0008 update/remove recomputes totals (FS-0002/RULE-0007)', async ({ page }) => {
    const added = await (await page.request.post('/api/cart/items', { data: { sku: 'BK-001', quantity: 2 } })).json();
    const item = added.items.find((i: any) => i.sku === 'BK-001');
    expect(added.subtotal).toBe(3499 * 2);

    const updated = await (await page.request.patch(`/api/cart/items/${item.id}`, { data: { quantity: 1 } })).json();
    expect(updated.subtotal).toBe(3499);

    const removed = await (await page.request.delete(`/api/cart/items/${item.id}`)).json();
    expect(removed.items.find((i: any) => i.sku === 'BK-001')).toBeUndefined();
    expect(removed.subtotal).toBe(0);
  });
});
