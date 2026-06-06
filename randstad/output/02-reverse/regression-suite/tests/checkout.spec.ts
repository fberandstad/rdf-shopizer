import { test, expect } from '@playwright/test';

// TEST-0009..0017 — Checkout/payment/order/invoice golden master.
// Links: FS-0003/0004/0005, RULE-0008..0014/0019/0020. Payment tests are @sandbox only.
const SHOP = process.env.BASE_URL_SHOP;
const SANDBOX = process.env.PAYMENT_SANDBOX === 'true';

test.describe('Checkout & order (golden master)', () => {
  test.skip(!SHOP, 'Set BASE_URL_SHOP to run E2E (start-tomcat.sh).');

  test('TEST-0009 checkout customer info advances to shipping', async ({ page }) => {
    await page.goto('/');
    // TODO(golden): add item -> checkout -> enter customer; assert advances (RULE-0008).
  });

  test('TEST-0010 shipping selection adds cost', async ({ page }) => {
    await page.goto('/');
    // TODO(golden): select shipping; assert cost added to totals (RULE-0019 inferred).
  });

  test('TEST-0011 place order with non-card method (COD/Free)', async ({ page }) => {
    await page.goto('/');
    // TODO(golden): select COD/Free; submit; assert thank-you + order persisted (RULE-0009/0012).
  });

  test('TEST-0012 card authorize @sandbox', async ({ page }) => {
    test.skip(!SANDBOX, 'Requires PAYMENT_SANDBOX=true and sandbox gateway creds. Never use live cards.');
    // TODO(golden): pay with sandbox card; assert authorize/capture per config (RULE-0009).
  });

  test('TEST-0014 no order persisted on payment failure @sandbox', async ({ page }) => {
    test.skip(!SANDBOX, 'Requires sandbox.');
    // TODO(golden): force decline; assert no order saved + error (RULE-0012).
  });

  test('TEST-0015 display order masks payment', async ({ page }) => {
    await page.goto('/');
    // TODO(golden): complete order; assert summary shows masked payment id (RULE-0014).
  });

  test('TEST-0017 invoice summary shows store-supported cards', async ({ page }) => {
    await page.goto('/');
    // TODO(golden): open invoice summary; assert line items/totals + per-store cards (RULE-0020).
  });
});
