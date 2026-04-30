import http from './client';
import type {
  Client, Invoice, Quotation, Supplier, Purchase, Expense,
  ExpenseCategory, ReportSummary, MonthlyTotal,
} from '../types';

// Clients
export const clients = {
  list: (search?: string) => http.get<Client[]>('/clients', { params: { search } }).then(r => r.data),
  get: (id: number) => http.get<Client>(`/clients/${id}`).then(r => r.data),
  create: (data: Partial<Client>) => http.post<Client>('/clients', data).then(r => r.data),
  update: (id: number, data: Partial<Client>) => http.patch<Client>(`/clients/${id}`, data).then(r => r.data),
  remove: (id: number) => http.delete(`/clients/${id}`),
};

// Invoices
export const invoices = {
  list: (params?: object) => http.get<Invoice[]>('/invoices', { params }).then(r => r.data),
  get: (id: number) => http.get<Invoice>(`/invoices/${id}`).then(r => r.data),
  create: (data: object) => http.post<Invoice>('/invoices', data).then(r => r.data),
  update: (id: number, data: object) => http.patch<Invoice>(`/invoices/${id}`, data).then(r => r.data),
  remove: (id: number) => http.delete(`/invoices/${id}`),
};

// Quotations
export const quotations = {
  list: (params?: object) => http.get<Quotation[]>('/quotations', { params }).then(r => r.data),
  get: (id: number) => http.get<Quotation>(`/quotations/${id}`).then(r => r.data),
  create: (data: object) => http.post<Quotation>('/quotations', data).then(r => r.data),
  update: (id: number, data: object) => http.patch<Quotation>(`/quotations/${id}`, data).then(r => r.data),
  remove: (id: number) => http.delete(`/quotations/${id}`),
  convert: (id: number) => http.post<Invoice>(`/quotations/${id}/convert`).then(r => r.data),
};

// Suppliers
export const suppliers = {
  list: (search?: string) => http.get<Supplier[]>('/suppliers', { params: { search } }).then(r => r.data),
  get: (id: number) => http.get<Supplier>(`/suppliers/${id}`).then(r => r.data),
  create: (data: Partial<Supplier>) => http.post<Supplier>('/suppliers', data).then(r => r.data),
  update: (id: number, data: Partial<Supplier>) => http.patch<Supplier>(`/suppliers/${id}`, data).then(r => r.data),
  remove: (id: number) => http.delete(`/suppliers/${id}`),
};

// Purchases
export const purchases = {
  list: (params?: object) => http.get<Purchase[]>('/purchases', { params }).then(r => r.data),
  get: (id: number) => http.get<Purchase>(`/purchases/${id}`).then(r => r.data),
  create: (data: object) => http.post<Purchase>('/purchases', data).then(r => r.data),
  update: (id: number, data: object) => http.patch<Purchase>(`/purchases/${id}`, data).then(r => r.data),
  remove: (id: number) => http.delete(`/purchases/${id}`),
};

// Expenses
export const expenses = {
  list: (params?: object) => http.get<Expense[]>('/expenses', { params }).then(r => r.data),
  get: (id: number) => http.get<Expense>(`/expenses/${id}`).then(r => r.data),
  create: (data: object) => http.post<Expense>('/expenses', data).then(r => r.data),
  update: (id: number, data: object) => http.patch<Expense>(`/expenses/${id}`, data).then(r => r.data),
  remove: (id: number) => http.delete(`/expenses/${id}`),
  categories: () => http.get<ExpenseCategory[]>('/expense-categories').then(r => r.data),
  createCategory: (data: object) => http.post<ExpenseCategory>('/expense-categories', data).then(r => r.data),
};

// Reports
export const reports = {
  summary: (params?: object) => http.get<ReportSummary>('/reports/summary', { params }).then(r => r.data),
  revenueByMonth: (year?: number) => http.get<{ year: number; data: MonthlyTotal[] }>('/reports/revenue-by-month', { params: { year } }).then(r => r.data),
  purchasesByMonth: (year?: number) => http.get<{ year: number; data: MonthlyTotal[] }>('/reports/purchases-by-month', { params: { year } }).then(r => r.data),
  expensesByCategory: (params?: object) => http.get('/reports/expenses-by-category', { params }).then(r => r.data),
  invoiceAging: () => http.get('/reports/invoice-aging').then(r => r.data),
};
