import { useQuery } from '@tanstack/react-query';
import { reports } from '../api';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, Clock, DollarSign } from 'lucide-react';

const fmt = (n: number) => new Intl.NumberFormat('en', { style: 'currency', currency: 'EUR' }).format(n);

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string; sub?: string; icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
      <div className={`p-2.5 rounded-lg ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="mt-0.5 text-2xl font-semibold text-gray-900">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const year = new Date().getFullYear();

  const { data: summary } = useQuery({ queryKey: ['summary'], queryFn: () => reports.summary() });
  const { data: revByMonth } = useQuery({ queryKey: ['revenue-by-month', year], queryFn: () => reports.revenueByMonth(year) });
  const { data: expByMonth } = useQuery({ queryKey: ['expenses-by-month', year], queryFn: () => reports.expensesByMonth(year) });

  const chartData = (revByMonth?.data ?? []).map((r, i) => ({
    month: MONTHS[i],
    revenue: r.total,
    expenses: expByMonth?.data[i]?.total ?? 0,
  }));

  return (
    <div>
      <div className="px-8 py-6 border-b border-gray-200 bg-white">
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-0.5 text-sm text-gray-500">Year-to-date overview</p>
      </div>

      <div className="p-8 space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Revenue"     value={fmt(summary?.revenue ?? 0)}     icon={DollarSign}  color="bg-green-500"  sub="Paid invoices" />
          <StatCard label="Outstanding" value={fmt(summary?.outstanding ?? 0)} icon={Clock}       color="bg-yellow-500" sub="Sent/overdue" />
          <StatCard label="Total Costs" value={fmt(summary?.total_costs ?? 0)} icon={TrendingDown} color="bg-red-500"   sub="Approved expenses" />
          <StatCard label="Profit"      value={fmt(summary?.profit ?? 0)}      icon={TrendingUp}  color="bg-blue-500"  sub="Revenue – costs" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Monthly Revenue {year}</h2>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `€${v}`} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#rev)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Revenue vs Expenses {year}</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `€${v}`} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Bar dataKey="revenue"  fill="#3b82f6" radius={[4,4,0,0]} name="Revenue" />
                <Bar dataKey="expenses" fill="#f87171" radius={[4,4,0,0]} name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
