export interface Client {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  tax_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface Invoice {
  id: number;
  number: string;
  client_id: number;
  client?: Client;
  issue_date: string;
  due_date: string;
  status: InvoiceStatus;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount: number;
  total: number;
  currency: string;
  notes: string | null;
  items?: InvoiceItem[];
  created_at: string;
  updated_at: string;
}

export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted';

export interface Quotation {
  id: number;
  number: string;
  client_id: number;
  client?: Client;
  issue_date: string;
  valid_until: string;
  status: QuotationStatus;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount: number;
  total: number;
  currency: string;
  notes: string | null;
  items?: InvoiceItem[];
  invoice_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  tax_number: string | null;
  created_at: string;
  updated_at: string;
}

export type PurchaseStatus = 'draft' | 'ordered' | 'received' | 'paid' | 'cancelled';

export interface Purchase {
  id: number;
  number: string;
  supplier_id: number;
  supplier?: Supplier;
  order_date: string;
  expected_date: string | null;
  received_date: string | null;
  status: PurchaseStatus;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount: number;
  total: number;
  currency: string;
  notes: string | null;
  items?: InvoiceItem[];
  created_at: string;
  updated_at: string;
}

export interface ExpenseCategory {
  id: number;
  name: string;
  color: string;
}

export type ExpenseStatus = 'pending' | 'approved' | 'rejected';

export interface Expense {
  id: number;
  category_id: number | null;
  category?: ExpenseCategory;
  description: string;
  vendor: string | null;
  amount: number;
  currency: string;
  date: string;
  status: ExpenseStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReportSummary {
  period: { from: string; to: string };
  revenue: number;
  outstanding: number;
  expenses: number;
  purchases: number;
  total_costs: number;
  profit: number;
}

export interface MonthlyTotal {
  month: string;
  total: number;
}
