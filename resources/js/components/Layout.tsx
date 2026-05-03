import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, ClipboardList,
  Receipt, Building2, TrendingUp,
} from 'lucide-react';

const nav = [
  { to: '/',           label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/clients',    label: 'Clients',      icon: Users },
  { to: '/invoices',   label: 'Invoices',     icon: FileText },
  { to: '/quotations', label: 'Quotations',   icon: ClipboardList },
  { to: '/suppliers',  label: 'Suppliers',    icon: Building2 },
  { to: '/expenses',   label: 'Expenses',     icon: Receipt },
  { to: '/reports',    label: 'Reports',      icon: TrendingUp },
];

export default function Layout() {
  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-56 shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-5 py-5 border-b border-gray-200">
          <span className="text-base font-semibold text-gray-900">Mechadvance</span>
          <span className="ml-1 text-base font-semibold text-blue-600">Finance</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
