import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { api } from './api.js';

const server = new McpServer({
  name: 'mechadvance-finance',
  version: '1.0.0',
});

// ─── Clients ────────────────────────────────────────────────────────────────

server.tool('list_clients', 'List all clients, optionally search by name', {
  search: z.string().optional().describe('Search term for client name'),
}, async ({ search }) => {
  const data = await api.get('/clients', { search });
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
});

server.tool('get_client', 'Get a single client with their invoices and quotations', {
  id: z.number().describe('Client ID'),
}, async ({ id }) => {
  const data = await api.get(`/clients/${id}`);
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
});

server.tool('create_client', 'Create a new client', {
  name:       z.string().describe('Client full name or company name'),
  email:      z.string().email().optional(),
  phone:      z.string().optional(),
  address:    z.string().optional(),
  city:       z.string().optional(),
  country:    z.string().optional(),
  tax_number: z.string().optional().describe('VAT or tax registration number'),
}, async (body) => {
  const data = await api.post('/clients', body);
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
});

server.tool('update_client', 'Update an existing client', {
  id:         z.number().describe('Client ID'),
  name:       z.string().optional(),
  email:      z.string().email().optional(),
  phone:      z.string().optional(),
  address:    z.string().optional(),
  city:       z.string().optional(),
  country:    z.string().optional(),
  tax_number: z.string().optional(),
}, async ({ id, ...body }) => {
  const data = await api.patch(`/clients/${id}`, body);
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
});

server.tool('delete_client', 'Delete a client', {
  id: z.number().describe('Client ID'),
}, async ({ id }) => {
  await api.delete(`/clients/${id}`);
  return { content: [{ type: 'text', text: `Client ${id} deleted.` }] };
});

// ─── Invoices ────────────────────────────────────────────────────────────────

const invoiceItemSchema = z.object({
  description: z.string(),
  quantity:    z.number().positive(),
  unit_price:  z.number().min(0),
});

server.tool('list_invoices', 'List invoices with optional filters', {
  status:    z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional(),
  client_id: z.number().optional(),
  from:      z.string().optional().describe('Start date YYYY-MM-DD'),
  to:        z.string().optional().describe('End date YYYY-MM-DD'),
}, async (params) => {
  const data = await api.get('/invoices', params as Record<string, string | number | undefined>);
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
});

server.tool('get_invoice', 'Get a single invoice with its line items', {
  id: z.number().describe('Invoice ID'),
}, async ({ id }) => {
  const data = await api.get(`/invoices/${id}`);
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
});

server.tool('create_invoice', 'Create a new invoice with line items', {
  client_id:  z.number().describe('Client ID'),
  issue_date: z.string().describe('Issue date YYYY-MM-DD'),
  due_date:   z.string().describe('Due date YYYY-MM-DD'),
  status:     z.enum(['draft', 'sent']).default('draft'),
  tax_rate:   z.number().min(0).max(100).default(0).describe('Tax percentage'),
  discount:   z.number().min(0).default(0).describe('Flat discount amount'),
  currency:   z.string().length(3).default('EUR'),
  notes:      z.string().optional(),
  items:      z.array(invoiceItemSchema).min(1),
}, async (body) => {
  const data = await api.post('/invoices', body);
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
});

server.tool('update_invoice', 'Update an invoice (status, dates, items, etc.)', {
  id:         z.number().describe('Invoice ID'),
  client_id:  z.number().optional(),
  issue_date: z.string().optional(),
  due_date:   z.string().optional(),
  status:     z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional(),
  tax_rate:   z.number().min(0).max(100).optional(),
  discount:   z.number().min(0).optional(),
  currency:   z.string().length(3).optional(),
  notes:      z.string().optional(),
  items:      z.array(invoiceItemSchema).optional(),
}, async ({ id, ...body }) => {
  const data = await api.patch(`/invoices/${id}`, body);
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
});

server.tool('delete_invoice', 'Delete an invoice', {
  id: z.number().describe('Invoice ID'),
}, async ({ id }) => {
  await api.delete(`/invoices/${id}`);
  return { content: [{ type: 'text', text: `Invoice ${id} deleted.` }] };
});

// ─── Quotations ──────────────────────────────────────────────────────────────

server.tool('list_quotations', 'List quotations with optional filters', {
  status:    z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired', 'converted']).optional(),
  client_id: z.number().optional(),
  from:      z.string().optional().describe('Start date YYYY-MM-DD'),
  to:        z.string().optional().describe('End date YYYY-MM-DD'),
}, async (params) => {
  const data = await api.get('/quotations', params as Record<string, string | number | undefined>);
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
});

server.tool('get_quotation', 'Get a single quotation with its line items', {
  id: z.number().describe('Quotation ID'),
}, async ({ id }) => {
  const data = await api.get(`/quotations/${id}`);
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
});

server.tool('create_quotation', 'Create a new quotation with line items', {
  client_id:   z.number().describe('Client ID'),
  issue_date:  z.string().describe('Issue date YYYY-MM-DD'),
  valid_until: z.string().describe('Expiry date YYYY-MM-DD'),
  status:      z.enum(['draft', 'sent']).default('draft'),
  tax_rate:    z.number().min(0).max(100).default(0),
  discount:    z.number().min(0).default(0),
  currency:    z.string().length(3).default('EUR'),
  notes:       z.string().optional(),
  items:       z.array(invoiceItemSchema).min(1),
}, async (body) => {
  const data = await api.post('/quotations', body);
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
});

server.tool('update_quotation', 'Update a quotation', {
  id:          z.number().describe('Quotation ID'),
  client_id:   z.number().optional(),
  issue_date:  z.string().optional(),
  valid_until: z.string().optional(),
  status:      z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired', 'converted']).optional(),
  tax_rate:    z.number().min(0).max(100).optional(),
  discount:    z.number().min(0).optional(),
  currency:    z.string().length(3).optional(),
  notes:       z.string().optional(),
  items:       z.array(invoiceItemSchema).optional(),
}, async ({ id, ...body }) => {
  const data = await api.patch(`/quotations/${id}`, body);
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
});

server.tool('convert_quotation_to_invoice', 'Convert an accepted quotation into a draft invoice', {
  id: z.number().describe('Quotation ID'),
}, async ({ id }) => {
  const data = await api.post(`/quotations/${id}/convert`, {});
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
});

server.tool('delete_quotation', 'Delete a quotation', {
  id: z.number().describe('Quotation ID'),
}, async ({ id }) => {
  await api.delete(`/quotations/${id}`);
  return { content: [{ type: 'text', text: `Quotation ${id} deleted.` }] };
});

// ─── Expenses ────────────────────────────────────────────────────────────────

server.tool('list_expenses', 'List expenses with optional filters', {
  category_id: z.number().optional(),
  status:      z.enum(['pending', 'approved', 'rejected']).optional(),
  vendor:      z.string().optional().describe('Partial vendor name search'),
  from:        z.string().optional().describe('Start date YYYY-MM-DD'),
  to:          z.string().optional().describe('End date YYYY-MM-DD'),
  min_amount:  z.number().min(0).optional().describe('Minimum net amount'),
  max_amount:  z.number().min(0).optional().describe('Maximum net amount'),
}, async (params) => {
  const data = await api.get('/expenses', params as Record<string, string | number | undefined>);
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
});

server.tool('get_expense', 'Get a single expense', {
  id: z.number().describe('Expense ID'),
}, async ({ id }) => {
  const data = await api.get(`/expenses/${id}`);
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
});

server.tool('create_expense', 'Log a new expense', {
  description: z.string(),
  amount:      z.number().positive().describe('Net amount before VAT'),
  vat_rate:    z.number().min(0).max(100).default(0).describe('VAT percentage'),
  date:        z.string().describe('Date YYYY-MM-DD'),
  category_id: z.number().optional(),
  vendor:      z.string().optional(),
  currency:    z.string().length(3).default('EUR'),
  status:      z.enum(['pending', 'approved', 'rejected']).default('pending'),
  notes:       z.string().optional(),
}, async (body) => {
  const data = await api.post('/expenses', body);
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
});

server.tool('update_expense', 'Update an expense', {
  id:          z.number().describe('Expense ID'),
  description: z.string().optional(),
  amount:      z.number().positive().optional().describe('Net amount before VAT'),
  vat_rate:    z.number().min(0).max(100).optional().describe('VAT percentage'),
  date:        z.string().optional(),
  category_id: z.number().optional(),
  vendor:      z.string().optional(),
  currency:    z.string().length(3).optional(),
  status:      z.enum(['pending', 'approved', 'rejected']).optional(),
  notes:       z.string().optional(),
}, async ({ id, ...body }) => {
  const data = await api.patch(`/expenses/${id}`, body);
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
});

server.tool('delete_expense', 'Delete an expense', {
  id: z.number().describe('Expense ID'),
}, async ({ id }) => {
  await api.delete(`/expenses/${id}`);
  return { content: [{ type: 'text', text: `Expense ${id} deleted.` }] };
});

server.tool('attach_receipt_to_expense',
  'Attach or replace a receipt image/PDF on an expense by providing a local file path',
  {
    id:        z.number().describe('Expense ID'),
    file_path: z.string().describe('Absolute path to the receipt file (jpg, png, webp, or pdf)'),
  },
  async ({ id, file_path }) => {
    const data = await api.postFile(`/expenses/${id}/receipt`, file_path, 'receipt');
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool('remove_receipt_from_expense',
  'Remove the receipt attached to an expense',
  { id: z.number().describe('Expense ID') },
  async ({ id }) => {
    const data = await api.delete(`/expenses/${id}/receipt`);
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool('list_expense_categories', 'List all expense categories', {}, async () => {
  const data = await api.get('/expense-categories');
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
});

server.tool('create_expense_category', 'Create a new expense category', {
  name:  z.string().describe('Category name'),
  color: z.string().optional().describe('Hex color e.g. #FF5733'),
}, async (body) => {
  const data = await api.post('/expense-categories', body);
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
});

// ─── Reports ─────────────────────────────────────────────────────────────────

server.tool('report_summary', 'Get financial summary: revenue, outstanding, expenses, profit', {
  from: z.string().optional().describe('Start date YYYY-MM-DD (defaults to start of year)'),
  to:   z.string().optional().describe('End date YYYY-MM-DD (defaults to today)'),
}, async (params) => {
  const data = await api.get('/reports/summary', params);
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
});

server.tool('report_revenue_by_month', 'Get monthly revenue totals for a given year', {
  year: z.number().optional().describe('4-digit year (defaults to current year)'),
}, async ({ year }) => {
  const data = await api.get('/reports/revenue-by-month', { year });
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
});

server.tool('report_expenses_by_category', 'Get expense totals grouped by category', {
  from: z.string().optional().describe('Start date YYYY-MM-DD'),
  to:   z.string().optional().describe('End date YYYY-MM-DD'),
}, async (params) => {
  const data = await api.get('/reports/expenses-by-category', params);
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
});

server.tool('report_invoice_aging', 'Get unpaid invoice aging buckets (0-30, 31-60, 61-90, 90+ days)', {}, async () => {
  const data = await api.get('/reports/invoice-aging');
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
});

// ─── Suppliers ───────────────────────────────────────────────────────────────

server.tool('list_suppliers', 'List all suppliers, optionally search by name', {
  search: z.string().optional().describe('Search term for supplier name'),
}, async ({ search }) => {
  const data = await api.get('/suppliers', { search });
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
});

server.tool('get_supplier', 'Get a single supplier with their purchase orders', {
  id: z.number().describe('Supplier ID'),
}, async ({ id }) => {
  const data = await api.get(`/suppliers/${id}`);
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
});

server.tool('create_supplier', 'Create a new supplier', {
  name:       z.string().describe('Supplier company name'),
  email:      z.string().email().optional(),
  phone:      z.string().optional(),
  address:    z.string().optional(),
  city:       z.string().optional(),
  country:    z.string().optional(),
  tax_number: z.string().optional().describe('VAT or tax registration number'),
}, async (body) => {
  const data = await api.post('/suppliers', body);
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
});

server.tool('update_supplier', 'Update an existing supplier', {
  id:         z.number().describe('Supplier ID'),
  name:       z.string().optional(),
  email:      z.string().email().optional(),
  phone:      z.string().optional(),
  address:    z.string().optional(),
  city:       z.string().optional(),
  country:    z.string().optional(),
  tax_number: z.string().optional(),
}, async ({ id, ...body }) => {
  const data = await api.patch(`/suppliers/${id}`, body);
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
});

server.tool('delete_supplier', 'Delete a supplier', {
  id: z.number().describe('Supplier ID'),
}, async ({ id }) => {
  await api.delete(`/suppliers/${id}`);
  return { content: [{ type: 'text', text: `Supplier ${id} deleted.` }] };
});

// ─── Purchases ───────────────────────────────────────────────────────────────

const purchaseItemSchema = z.object({
  description: z.string(),
  quantity:    z.number().positive(),
  unit_price:  z.number().min(0),
});

server.tool('list_purchases', 'List purchase orders with optional filters', {
  status:      z.enum(['draft', 'ordered', 'received', 'paid', 'cancelled']).optional(),
  supplier_id: z.number().optional(),
  from:        z.string().optional().describe('Start date YYYY-MM-DD'),
  to:          z.string().optional().describe('End date YYYY-MM-DD'),
}, async (params) => {
  const data = await api.get('/purchases', params as Record<string, string | number | undefined>);
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
});

server.tool('get_purchase', 'Get a single purchase order with its line items', {
  id: z.number().describe('Purchase ID'),
}, async ({ id }) => {
  const data = await api.get(`/purchases/${id}`);
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
});

server.tool('create_purchase', 'Create a new purchase order with line items', {
  supplier_id:   z.number().describe('Supplier ID'),
  order_date:    z.string().describe('Order date YYYY-MM-DD'),
  expected_date: z.string().optional().describe('Expected delivery date YYYY-MM-DD'),
  status:        z.enum(['draft', 'ordered']).default('draft'),
  tax_rate:      z.number().min(0).max(100).default(0).describe('Tax percentage'),
  discount:      z.number().min(0).default(0).describe('Flat discount amount'),
  currency:      z.string().length(3).default('EUR'),
  notes:         z.string().optional(),
  items:         z.array(purchaseItemSchema).min(1),
}, async (body) => {
  const data = await api.post('/purchases', body);
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
});

server.tool('update_purchase', 'Update a purchase order (status, dates, items, etc.)', {
  id:            z.number().describe('Purchase ID'),
  supplier_id:   z.number().optional(),
  order_date:    z.string().optional(),
  expected_date: z.string().optional(),
  received_date: z.string().optional().describe('Actual delivery date YYYY-MM-DD'),
  status:        z.enum(['draft', 'ordered', 'received', 'paid', 'cancelled']).optional(),
  tax_rate:      z.number().min(0).max(100).optional(),
  discount:      z.number().min(0).optional(),
  currency:      z.string().length(3).optional(),
  notes:         z.string().optional(),
  items:         z.array(purchaseItemSchema).optional(),
}, async ({ id, ...body }) => {
  const data = await api.patch(`/purchases/${id}`, body);
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
});

server.tool('delete_purchase', 'Delete a purchase order', {
  id: z.number().describe('Purchase ID'),
}, async ({ id }) => {
  await api.delete(`/purchases/${id}`);
  return { content: [{ type: 'text', text: `Purchase ${id} deleted.` }] };
});

server.tool('report_purchases_by_month', 'Get monthly purchase totals for a given year', {
  year: z.number().optional().describe('4-digit year (defaults to current year)'),
}, async ({ year }) => {
  const data = await api.get('/reports/purchases-by-month', { year });
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
});

// ─── Start ───────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
