import { Page, APIRequestContext, expect } from '@playwright/test';

export const ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL || 'admin@randstad.fr';
export const ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';

// Log in through the real UI so the session cookie is set on the browser context.
export async function login(page: Page) {
  await page.goto('/');
  await page.locator('input[type="email"]').fill(ADMIN_EMAIL);
  await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();
  // Storefront search box is the landing surface after login.
  await expect(page.getByPlaceholder('Search products...')).toBeVisible();
}

// Empty the cart via the API (shares cookies with the page context) for deterministic state.
export async function clearCart(request: APIRequestContext) {
  const res = await request.get('/api/cart');
  if (!res.ok()) return;
  const cart = await res.json();
  for (const item of cart.items || []) {
    await request.delete(`/api/cart/items/${item.id}`);
  }
}
