// ShopiClaw frontend actions (ADR-0003/0005).
//
// CopilotKit's OpenAIAdapter advertises tools to the LLM but does NOT execute
// backend `CopilotRuntime` action handlers — it emits the tool call to the client
// for execution. So we register the agent's tools as *frontend* actions here; each
// handler proxies to `POST /api/agent/tool`, where the real (server-authoritative)
// handler runs through ClawBands (audit + guarded-tool HITL approval) scoped to the
// logged-in user. This keeps all business logic + policy on the server.
import { useCopilotAction } from '@copilotkit/react-core';
import { api } from '../config';

// Execute a named server tool. Returns the tool result on success, or a
// human-readable status string (approval required / error) the LLM can relay.
async function callTool(name, args) {
  try {
    const res = await api('/api/agent/tool', {
      method: 'POST',
      body: JSON.stringify({ name, args: args || {} }),
    });
    if (res.ok) return res.result;
    return res.message || res.error || 'The action could not be completed.';
  } catch (e) {
    // api() throws on non-2xx; surface the message so the assistant can explain.
    return `Error: ${e.message}`;
  }
}

// Register every action unconditionally (hooks rule). Each maps 1:1 to a server tool.
export default function useShopiClawActions() {
  // --- Catalog (read) ---
  useCopilotAction({
    name: 'searchCatalog',
    description: 'Search products by keyword and/or category. Returns enabled products only.',
    parameters: [
      { name: 'q', type: 'string', description: 'Keyword to match in the product name', required: false },
      { name: 'categoryCode', type: 'string', description: 'Category code to filter by', required: false },
    ],
    handler: (args) => callTool('searchCatalog', args),
  });

  useCopilotAction({
    name: 'getProduct',
    description: 'Get a single product by SKU (name, price, attributes, stock).',
    parameters: [{ name: 'sku', type: 'string', description: 'Product SKU', required: true }],
    handler: (args) => callTool('getProduct', args),
  });

  useCopilotAction({
    name: 'listCategories',
    description: 'List catalog categories (code, name, parent, product count) for browsing/filtering.',
    parameters: [],
    handler: () => callTool('listCategories', {}),
  });

  // --- Cart (read/write) ---
  useCopilotAction({
    name: 'getCart',
    description: 'Get the current shopping cart with server-computed totals.',
    parameters: [],
    handler: () => callTool('getCart', {}),
  });

  useCopilotAction({
    name: 'addToCart',
    description: 'Add a product (by SKU) to the cart. Enforces stock, required options and positive quantity; totals are recomputed server-side.',
    parameters: [
      { name: 'sku', type: 'string', description: 'Product SKU to add', required: true },
      { name: 'quantity', type: 'number', description: 'Quantity to add (default 1)', required: false },
    ],
    handler: (args) => callTool('addToCart', { sku: args.sku, quantity: args.quantity ?? 1 }),
  });

  useCopilotAction({
    name: 'updateCart',
    description: 'Update a cart line quantity (0 removes it). Totals recomputed server-side.',
    parameters: [
      { name: 'itemId', type: 'number', description: 'Cart line item id', required: true },
      { name: 'quantity', type: 'number', description: 'New quantity (0 removes the line)', required: true },
    ],
    handler: (args) => callTool('updateCart', args),
  });

  useCopilotAction({
    name: 'calculateShipping',
    description: 'List the available shipping methods and their server-authoritative costs.',
    parameters: [],
    handler: () => callTool('calculateShipping', {}),
  });

  // --- Orders (read/write) ---
  useCopilotAction({
    name: 'createOrder',
    description: 'Create an order from the current cart. Provide the customer name and email. Totals are server-authoritative; the order awaits payment.',
    parameters: [
      { name: 'customerName', type: 'string', description: 'Customer full name', required: true },
      { name: 'customerEmail', type: 'string', description: 'Customer email address', required: true },
      { name: 'shippingMethod', type: 'string', description: 'Shipping method code (e.g. STANDARD, EXPRESS)', required: false },
    ],
    handler: (args) => callTool('createOrder', {
      customer: { name: args.customerName, email: args.customerEmail },
      shippingMethod: args.shippingMethod,
    }),
  });

  useCopilotAction({
    name: 'getOrderStatus',
    description: "Get one of the current user's orders by id (owner-scoped; payment masked).",
    parameters: [{ name: 'orderId', type: 'number', description: 'Order id', required: true }],
    handler: (args) => callTool('getOrderStatus', args),
  });

  useCopilotAction({
    name: 'listMyOrders',
    description: "List the current user's orders (owner-scoped).",
    parameters: [],
    handler: () => callTool('listMyOrders', {}),
  });

  // --- Reviews & newsletter ---
  useCopilotAction({
    name: 'listProductReviews',
    description: 'List reviews (rating, title, body, author) and average rating for a product SKU.',
    parameters: [{ name: 'sku', type: 'string', description: 'Product SKU', required: true }],
    handler: (args) => callTool('listProductReviews', args),
  });

  useCopilotAction({
    name: 'submitReview',
    description: "Post or update the current user's review for a product (rating 1-5).",
    parameters: [
      { name: 'sku', type: 'string', description: 'Product SKU', required: true },
      { name: 'rating', type: 'number', description: 'Rating from 1 to 5', required: true },
      { name: 'title', type: 'string', description: 'Review title', required: false },
      { name: 'body', type: 'string', description: 'Review body', required: false },
    ],
    handler: (args) => callTool('submitReview', args),
  });

  useCopilotAction({
    name: 'subscribeNewsletter',
    description: 'Subscribe an email to the newsletter with explicit consent.',
    parameters: [
      { name: 'email', type: 'string', description: 'Email address to subscribe', required: true },
      { name: 'consent', type: 'boolean', description: 'Explicit consent (default true)', required: false },
    ],
    handler: (args) => callTool('subscribeNewsletter', args),
  });

  // --- Knowledge & health ---
  useCopilotAction({
    name: 'twinKnowledgeSearch',
    description: 'Answer questions about ShopiClaw itself (architecture, business rules, ADRs, legacy behavior) grounded in the Digital Twin, with citations.',
    parameters: [{ name: 'question', type: 'string', description: 'The question about ShopiClaw', required: true }],
    handler: (args) => callTool('twinKnowledgeSearch', args),
  });

  useCopilotAction({
    name: 'ragSearch',
    description: 'Semantic search over the product/policy knowledge base.',
    parameters: [
      { name: 'query', type: 'string', description: 'Search query', required: true },
      { name: 'collection', type: 'string', description: "Collection: 'catalog' or 'policy'", required: false },
    ],
    handler: (args) => callTool('ragSearch', args),
  });

  useCopilotAction({
    name: 'getSystemHealth',
    description: 'Report ShopiClaw health: database, OpenAI config, heartbeat, version.',
    parameters: [],
    handler: () => callTool('getSystemHealth', {}),
  });

  useCopilotAction({
    name: 'getBusinessMetrics',
    description: 'Functional analytics via named, allow-listed metrics (orders processed, revenue, AOV, abandonment, low stock, top products, new customers). Role-scoped.',
    parameters: [
      { name: 'metric', type: 'string', description: 'One of: orders_count, revenue, aov, cart_abandonment, top_products, low_stock_count, new_customers', required: true },
      { name: 'period', type: 'string', description: 'One of: today, week, month, ytd (default today)', required: false },
    ],
    handler: (args) => callTool('getBusinessMetrics', args),
  });

  // --- Guarded (money-path / admin) — server returns an approval-required signal ---
  useCopilotAction({
    name: 'payOrder',
    description: 'Pay an order with a tokenized payment (NEVER a card number). Guarded: requires human approval before it runs.',
    parameters: [
      { name: 'orderId', type: 'number', description: 'Order id to pay', required: true },
      { name: 'paymentToken', type: 'string', description: 'Tokenized payment reference (never a raw card number)', required: true },
      { name: 'mode', type: 'string', description: 'authorize | capture | authorizeAndCapture', required: false },
    ],
    handler: (args) => callTool('payOrder', args),
  });

  useCopilotAction({
    name: 'manageCatalog',
    description: 'Create or update a product (admin). Guarded: requires human approval before it runs.',
    parameters: [
      { name: 'action', type: 'string', description: "'create' or 'update'", required: true },
      { name: 'sku', type: 'string', description: 'Product SKU', required: true },
      { name: 'name', type: 'string', description: 'Product name', required: false },
      { name: 'priceCents', type: 'number', description: 'Price in minor units (cents)', required: false },
      { name: 'description', type: 'string', description: 'Product description', required: false },
      { name: 'categoryCode', type: 'string', description: 'Category code', required: false },
      { name: 'stock', type: 'number', description: 'Stock quantity', required: false },
      { name: 'enabled', type: 'boolean', description: 'Whether the product is enabled', required: false },
    ],
    handler: (args) => callTool('manageCatalog', args),
  });

  useCopilotAction({
    name: 'manageInventory',
    description: 'Adjust product stock by a signed delta (admin). Guarded: requires human approval before it runs.',
    parameters: [
      { name: 'sku', type: 'string', description: 'Product SKU', required: true },
      { name: 'delta', type: 'number', description: 'Signed stock delta (e.g. -3 or +10)', required: true },
    ],
    handler: (args) => callTool('manageInventory', args),
  });
}
