import { test, expect } from '@playwright/test';

// TEST-0018..0022 — Customer account golden master. Links: FS-0006/0007/0009, RULE-0015.
const SHOP = process.env.BASE_URL_SHOP;

test.describe('Customer account (golden master)', () => {
  test.skip(!SHOP, 'Set BASE_URL_SHOP to run E2E (start-tomcat.sh).');

  test('TEST-0018 register and login', async ({ page }) => {
    await page.goto('/');
    // TODO(golden): register a customer; log in; assert authenticated session.
  });

  test('TEST-0019 profile and address CRUD', async ({ page }) => {
    await page.goto('/');
    // TODO(golden): edit profile/address; assert persisted.
  });

  test('TEST-0020 post product review', async ({ page }) => {
    await page.goto('/');
    // TODO(golden): submit review; assert tied to product/customer.
  });

  test('TEST-0021 digital download requires role', async ({ page }) => {
    await page.goto('/');
    // TODO(golden): attempt download without role -> denied; with role -> file (RULE-0015).
  });

  test('TEST-0022 newsletter subscribe', async ({ page }) => {
    await page.goto('/');
    // TODO(golden): submit email; assert captured (PII handling note).
  });
});
