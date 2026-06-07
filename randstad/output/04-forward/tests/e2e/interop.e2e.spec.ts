import { test, expect, request as pwRequest } from '@playwright/test';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from './helpers';

// Golden master TEST-0028 (FS-0015 SOAP→REST) + MCP server + Heartbeat (Wave 6).
// Requires the server to be started with a client token; tests use MCP_TOKEN below.
test.describe.configure({ mode: 'serial' });

const MCP_TOKEN = 'interop-test-token'; // matches MCP_CLIENT_TOKENS used to start the test server
const uniq = (p: string) => `${p}${Date.now()}${Math.floor(Math.random() * 1e4)}`;

async function adminCtx(baseURL: string) {
  const ctx = await pwRequest.newContext({ baseURL });
  await ctx.post('/auth/login', { data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
  return ctx;
}

test.describe('Interop & Heartbeat (new app)', () => {
  test('TEST-0028 SOAP→REST: service descriptor + OpenAPI reachable (replaces WSDL)', async ({ baseURL }) => {
    const anon = await pwRequest.newContext({ baseURL });
    const desc = await (await anon.get('/api/interop/')).json();
    expect(desc.version).toBe('v1');
    expect(desc.replaces).toContain('salesManagerInvoiceService');
    expect(desc.replaces).toContain('salesManagerCustomerService');
    const oas = await (await anon.get('/api/interop/openapi.json')).json();
    expect(oas.openapi).toMatch(/^3\./);
    expect(oas.paths['/invoices/{orderId}']).toBeTruthy();
    await anon.dispose();
  });

  test('interop data endpoints require a client bearer token (401 without)', async ({ baseURL }) => {
    const anon = await pwRequest.newContext({ baseURL });
    const res = await anon.get('/api/interop/v1/customers/1');
    expect(res.status()).toBe(401);
    await anon.dispose();
  });

  test('TEST-0028b invoice service returns masked payment (RULE-0014); never raw token', async ({ baseURL }) => {
    // Customer creates + pays an order.
    const cust = await pwRequest.newContext({ baseURL });
    await cust.post('/auth/register', { data: { email: `${uniq('io')}@example.io`, password: 'password123', name: 'IO' } });
    await cust.post('/api/cart/items', { data: { sku: 'BK-001', quantity: 1 } });
    const order = await (await cust.post('/api/checkout/order',
      { data: { customer: { name: 'IO', email: 'io@example.io' } } })).json();
    await cust.post('/api/checkout/pay', { data: { orderId: order.id, paymentToken: 'tok_test_visa' } });
    await cust.dispose();

    const ext = await pwRequest.newContext({ baseURL, extraHTTPHeaders: { authorization: `Bearer ${MCP_TOKEN}` } });
    const inv = await ext.get(`/api/interop/v1/invoices/${order.id}`);
    expect(inv.status()).toBe(200);
    const body = await inv.json();
    expect(body.payment.ref).toMatch(/^••••/);
    expect(JSON.stringify(body)).not.toContain('tok_test_visa'); // raw token never exposed
    await ext.dispose();
  });

  test('MCP: initialize + tools/list (inputSchema, guarded hidden) + default-deny', async ({ baseURL }) => {
    const ext = await pwRequest.newContext({ baseURL, extraHTTPHeaders: { authorization: `Bearer ${MCP_TOKEN}` } });
    const init = await (await ext.post('/mcp', { data: { method: 'initialize' } })).json();
    expect(init.serverInfo.name).toBe('shopiclaw-mcp');
    expect(init.protocolVersion).toBeTruthy();

    const list = await (await ext.post('/mcp', { data: { method: 'tools/list' } })).json();
    const names = list.tools.map((t: any) => t.name);
    expect(names).toContain('searchCatalog');
    expect(names).not.toContain('payOrder');
    expect(names).not.toContain('manageCatalog');
    expect(list.tools.find((t: any) => t.name === 'searchCatalog').inputSchema.type).toBe('object');

    const resources = await (await ext.post('/mcp', { data: { method: 'resources/list' } })).json();
    expect(resources.resources.length).toBeGreaterThanOrEqual(3);

    // Guarded tool call is denied over MCP (403).
    const denied = await ext.post('/mcp', { data: { method: 'tools/call', params: { name: 'manageCatalog', arguments: {} } } });
    expect(denied.status()).toBe(403);
    await ext.dispose();
  });

  test('MCP requires a valid client token (401)', async ({ baseURL }) => {
    const anon = await pwRequest.newContext({ baseURL });
    const res = await anon.post('/mcp', { data: { method: 'tools/list' } });
    expect(res.status()).toBe(401);
    await anon.dispose();
  });

  test('Heartbeat: admin can run jobs → notifications persisted', async ({ baseURL }) => {
    const ctx = await adminCtx(baseURL!);
    const run = await (await ctx.post('/api/admin/heartbeat/run', { data: {} })).json();
    expect(run.briefing).toBeTruthy();
    expect(typeof run.briefing.orders).toBe('number');
    const notes = await (await ctx.get('/api/admin/notifications')).json();
    expect(Array.isArray(notes)).toBeTruthy();
    expect(notes.some((n: any) => n.type === 'briefing')).toBeTruthy();
    await ctx.dispose();
  });
});
