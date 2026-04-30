import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reports } from '../api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import PageHeader from '../components/PageHeader';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const fmt = (n: number) => new Intl.NumberFormat('en', { style: 'currency', currency: 'EUR' }).format(n);
const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316'];

export default function Reports() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  const { data: summary } = useQuery({ queryKey: ['summary'], queryFn: () => reports.summary() });
  const { data: revByMonth } = useQuery({ queryKey: ['revenue-by-month', year], queryFn: () => reports.revenueByMonth(year) });
  const { data: purByMonth } = useQuery({ queryKey: ['purchases-by-month', year], queryFn: () => reports.purchasesByMonth(year) });
  const { data: expByCat } = useQuery({ queryKey: ['expenses-by-category'], queryFn: () => reports.expensesByCategory() });
  const { data: aging } = useQuery({ queryKey: ['invoice-aging'], queryFn: () => reports.invoiceAging() });

  const monthlyData = (revByMonth?.data ?? []).map((r, i) => ({
    month: MONTHS[i],
    revenue: r.total,
    purchases: purByMonth?.data[i]?.total ?? 0,
  }));

  const catData = (expByCat as any)?.data ?? [];
  const agingData = aging
    ? [
        { label: '0–30 days',  value: (aging as any).current },
        { label: '31–60 days', value: (aging as any)['31_60'] },
        { label: '61–90 days', value: (aging as any)['61_90'] },
        { label: '90+ days',   value: (aging as any).over_90 },
      ]
    : [];

  return (
    <div>
      <PageHeader title="Reports" subtitle="Financial overview" />

      <div className="p-8 space-y-8">
        {/* KPI strip */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Revenue (YTD)',    value: fmt(summary?.revenue ?? 0),     color: 'text-green-600' },
            { label: 'Total Costs (YTD)', value: fmt(summary?.total_costs ?? 0), color: 'text-red-500' },
            { label: 'Profit (YTD)',     value: fmt(summary?.profit ?? 0),      color: (summary?.profit ?? 0) >= 0 ? 'text-blue-600' : 'text-red-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{label}</p>
              <p className={`mt-1 text-2xl font-semibold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Revenue vs Purchases */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Revenue vs Purchases by Month</h2>
            <div className="flex gap-1">
              {[currentYear - 1, currentYear].map(y => (
                <button key={y} onClick={() => setYear(y)}
                  className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${year === y ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-500 border-gray-200 hover:border-gray-400'}`}>
                  {y}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `€${v}`} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Legend />
              <Bar dataKey="revenue"   name="Revenue"   fill="#3b82f6" radius={[4,4,0,0]} />
              <Bar dataKey="purchases" name="Purchases" fill="#f87171" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Expenses by category */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Expenses by Category (YTD)</h2>
            {catData.length === 0 ? (
              <p className="text-gray-400 text-sm py-10 text-center">No approved expenses yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={catData} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={90} label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {catData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Invoice aging */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Invoice Aging (Unpaid)</h2>
            {agingData.every(d => d.value === 0) ? (
              <p className="text-gray-400 text-sm py-10 text-center">No outstanding invoices</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={agingData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `€${v}`} />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Bar dataKey="value" fill="#f59e0b" radius={[0,4,4,0]} name="Outstanding" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
