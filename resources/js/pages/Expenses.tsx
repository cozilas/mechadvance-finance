import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { expenses as api } from '../api';
import type { Expense, ExpenseStatus } from '../types';
import PageHeader from '../components/PageHeader';
import Table from '../components/Table';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';

const STATUSES: ExpenseStatus[] = ['pending', 'approved', 'rejected'];
const fmt = (n: number | string) => `€${parseFloat(String(n)).toFixed(2)}`;

function ExpenseForm({ initial, onSave, onClose }: {
  initial?: Partial<Expense>;
  onSave: (d: any) => void;
  onClose: () => void;
}) {
  const { data: categories = [] } = useQuery({ queryKey: ['expense-categories'], queryFn: () => api.categories() });
  const { register, handleSubmit } = useForm({
    defaultValues: {
      description: initial?.description ?? '',
      vendor: initial?.vendor ?? '',
      amount: initial?.amount ?? '',
      currency: initial?.currency ?? 'EUR',
      date: initial?.date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      category_id: initial?.category_id ?? '',
      status: initial?.status ?? 'pending',
      notes: initial?.notes ?? '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">Description *</label>
          <input {...register('description', { required: true })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Amount *</label>
          <input {...register('amount', { required: true })} type="number" step="0.01" min="0" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Date *</label>
          <input {...register('date', { required: true })} type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Vendor</label>
          <input {...register('vendor')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Currency</label>
          <input {...register('currency')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
          <select {...register('category_id')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Uncategorised</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
          <select {...register('status')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
          <textarea {...register('notes')} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
        <button type="submit" className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700">Save</button>
      </div>
    </form>
  );
}

export default function Expenses() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<'create' | Expense | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const { data = [] } = useQuery({
    queryKey: ['expenses', statusFilter],
    queryFn: () => api.list(statusFilter ? { status: statusFilter } : undefined),
  });

  const create = useMutation({
    mutationFn: (d: any) => api.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); setModal(null); },
  });
  const update = useMutation({
    mutationFn: ({ id, ...d }: any) => api.update(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); setModal(null); },
  });
  const remove = useMutation({
    mutationFn: (id: number) => api.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  });

  const columns = [
    { key: 'date',        header: 'Date',     render: (r: Expense) => r.date?.slice(0, 10) },
    { key: 'description', header: 'Description' },
    { key: 'vendor',      header: 'Vendor',   render: (r: Expense) => r.vendor ?? '—' },
    { key: 'category',    header: 'Category', render: (r: Expense) => r.category?.name ?? 'Uncategorised' },
    { key: 'amount',      header: 'Amount',   render: (r: Expense) => fmt(r.amount) },
    { key: 'status',      header: 'Status',   render: (r: Expense) => <StatusBadge status={r.status} /> },
    {
      key: 'actions', header: '',
      render: (r: Expense) => (
        <div className="flex gap-2 justify-end" onClick={e => e.stopPropagation()}>
          <button onClick={() => setModal(r)} className="text-gray-400 hover:text-blue-600"><Pencil size={14} /></button>
          <button onClick={() => confirm('Delete expense?') && remove.mutate(r.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Expenses"
        subtitle={`${data.length} records`}
        action={
          <button onClick={() => setModal('create')} className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700">
            <Plus size={15} /> New Expense
          </button>
        }
      />
      <div className="p-8 space-y-4">
        <div className="flex gap-2">
          {['', ...STATUSES].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${statusFilter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <Table columns={columns} data={data as unknown as Record<string, unknown>[]} />
        </div>
      </div>

      {modal && (
        <Modal title={modal === 'create' ? 'New Expense' : 'Edit Expense'} onClose={() => setModal(null)}>
          <ExpenseForm
            initial={modal !== 'create' ? modal : undefined}
            onSave={(d) => modal === 'create' ? create.mutate(d) : update.mutate({ ...d, id: (modal as Expense).id })}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  );
}
