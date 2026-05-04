import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Pencil, Trash2, Paperclip, Trash } from 'lucide-react';
import { expenses as api } from '../api';
import type { Expense, ExpenseStatus } from '../types';
import PageHeader from '../components/PageHeader';
import Table from '../components/Table';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';

const STATUSES: ExpenseStatus[] = ['pending', 'approved', 'rejected'];
const fmt = (n: number | string) => `€${parseFloat(String(n)).toFixed(2)}`;

function ReceiptPanel({
  receiptUrl,
  receiptPath,
  pendingFile,
  onAttach,
  onRemove,
  uploading,
  fileRef,
}: {
  receiptUrl: string | null;
  receiptPath: string | null;
  pendingFile?: boolean;
  onAttach: () => void;
  onRemove: () => void;
  uploading?: boolean;
  fileRef: React.RefObject<HTMLInputElement>;
}) {
  const isPdf = receiptPath?.endsWith('.pdf') || (pendingFile && receiptPath != null && receiptPath.endsWith('.pdf'));

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex items-center justify-between shrink-0">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Receipt</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onAttach}
            disabled={uploading}
            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            <Paperclip size={11} /> {receiptUrl ? 'Replace' : 'Attach'}
          </button>
          {receiptUrl && (
            <button
              type="button"
              onClick={onRemove}
              disabled={uploading}
              className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50"
            >
              <Trash size={11} /> Remove
            </button>
          )}
        </div>
      </div>

      {receiptUrl ? (
        isPdf ? (
          <iframe
            src={receiptUrl}
            className="w-full flex-1 min-h-0 rounded-lg border border-gray-200"
            title="Receipt PDF"
          />
        ) : (
          <a href={receiptUrl} target="_blank" rel="noreferrer" className="flex-1 min-h-0 block">
            <img
              src={receiptUrl}
              alt="Receipt"
              className="w-full h-full rounded-lg border border-gray-200 object-contain hover:opacity-90 transition-opacity"
            />
          </a>
        )
      ) : (
        <button
          type="button"
          onClick={onAttach}
          className="flex-1 min-h-0 flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors"
        >
          <Paperclip size={22} />
          <span className="text-xs">Attach receipt</span>
        </button>
      )}

      {uploading && <p className="text-xs text-gray-400 shrink-0">Uploading…</p>}
    </div>
  );
}

function ExpenseForm({ initial, onSave, onClose }: {
  initial?: Partial<Expense>;
  onSave: (d: any, file?: File) => void;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(initial?.receipt_url ?? null);
  const [receiptPath, setReceiptPath] = useState<string | null>(initial?.receipt_path ?? null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const { data: categories = [] } = useQuery({ queryKey: ['expense-categories'], queryFn: () => api.categories() });
  const { register, handleSubmit } = useForm({
    defaultValues: {
      description: initial?.description ?? '',
      vendor: initial?.vendor ?? '',
      amount: initial?.amount ?? '',
      vat_rate: initial?.vat_rate ?? 0,
      currency: initial?.currency ?? 'EUR',
      date: initial?.date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      category_id: initial?.category_id ?? '',
      status: initial?.status ?? 'pending',
      notes: initial?.notes ?? '',
    },
  });

  const uploadReceipt = useMutation({
    mutationFn: (file: File) => api.uploadReceipt(initial!.id!, file),
    onSuccess: (updated) => {
      setReceiptUrl(updated.receipt_url);
      setReceiptPath(updated.receipt_path);
      qc.invalidateQueries({ queryKey: ['expenses'] });
    },
  });

  const removeReceipt = useMutation({
    mutationFn: () => api.deleteReceipt(initial!.id!),
    onSuccess: () => {
      setReceiptUrl(null);
      setReceiptPath(null);
      qc.invalidateQueries({ queryKey: ['expenses'] });
    },
  });

  const handleFileChange = (file: File) => {
    if (initial?.id) {
      uploadReceipt.mutate(file);
    } else {
      if (receiptUrl) URL.revokeObjectURL(receiptUrl);
      setPendingFile(file);
      setReceiptUrl(URL.createObjectURL(file));
      setReceiptPath(file.name);
    }
  };

  const handleRemove = () => {
    if (initial?.id) {
      removeReceipt.mutate();
    } else {
      if (receiptUrl) URL.revokeObjectURL(receiptUrl);
      setPendingFile(null);
      setReceiptUrl(null);
      setReceiptPath(null);
    }
  };

  return (
    <form onSubmit={handleSubmit(d => onSave(d, pendingFile ?? undefined))} className="flex flex-col h-full gap-4">
      <div className="flex gap-6 flex-1 min-h-0">
        <div className="w-1/2 shrink-0 flex flex-col">
          <ReceiptPanel
            receiptUrl={receiptUrl}
            receiptPath={receiptPath}
            pendingFile={!!pendingFile}
            onAttach={() => fileRef.current?.click()}
            onRemove={handleRemove}
            uploading={uploadReceipt.isPending}
            fileRef={fileRef}
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFileChange(f); e.target.value = ''; }}
          />
        </div>
        <div className="flex-1 overflow-y-auto space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Description *</label>
              <input {...register('description', { required: true })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Net Amount *</label>
              <input {...register('amount', { required: true })} type="number" step="0.01" min="0" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">VAT %</label>
              <input {...register('vat_rate')} type="number" step="0.01" min="0" max="100" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
        </div>
      </div>

      <div className="flex justify-end gap-2 shrink-0">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
        <button type="submit" className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700">Save</button>
      </div>
    </form>
  );
}

function ExpenseDetail({ expense, onClose, onEdit, onUpdate }: {
  expense: Expense;
  onClose: () => void;
  onEdit: () => void;
  onUpdate: (e: Expense) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const uploadReceipt = useMutation({
    mutationFn: (file: File) => api.uploadReceipt(expense.id, file),
    onSuccess: (updated) => { qc.invalidateQueries({ queryKey: ['expenses'] }); onUpdate(updated); },
  });
  const removeReceipt = useMutation({
    mutationFn: () => api.deleteReceipt(expense.id),
    onSuccess: (updated) => { qc.invalidateQueries({ queryKey: ['expenses'] }); onUpdate(updated); },
  });

  const row = (label: string, value: React.ReactNode) => (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-gray-800">{value ?? '—'}</span>
    </div>
  );

  return (
    <Modal title="Expense Details" onClose={onClose} wide>
      <div className="flex flex-col h-full gap-4">
        <div className="flex gap-6 flex-1 min-h-0">
          <div className="w-1/2 shrink-0 flex flex-col">
            <ReceiptPanel
              receiptUrl={expense.receipt_url}
              receiptPath={expense.receipt_path}
              onAttach={() => fileRef.current?.click()}
              onRemove={() => removeReceipt.mutate()}
              uploading={uploadReceipt.isPending || removeReceipt.isPending}
              fileRef={fileRef}
            />
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadReceipt.mutate(f); e.target.value = ''; }}
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-gray-900">{expense.description}</p>
                {expense.vendor && <p className="text-sm text-gray-500 mt-0.5">{expense.vendor}</p>}
              </div>
              <StatusBadge status={expense.status} />
            </div>

            <div className="flex items-end gap-4">
              <div>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Gross</span>
                <div className="text-2xl font-bold text-gray-900">
                  {fmt(expense.gross_amount)} <span className="text-base font-normal text-gray-400">{expense.currency}</span>
                </div>
              </div>
              <div className="pb-1 text-sm text-gray-500">
                Net {fmt(expense.amount)} + VAT {fmt(expense.vat_amount)} ({expense.vat_rate}%)
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {row('Date', expense.date?.slice(0, 10))}
              {row('Category', expense.category?.name ?? 'Uncategorised')}
              {row('Vendor', expense.vendor)}
              {row('Currency', expense.currency)}
            </div>

            {expense.notes && (
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Notes</span>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{expense.notes}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
              {row('Created', new Date(expense.created_at).toLocaleDateString())}
              {row('Updated', new Date(expense.updated_at).toLocaleDateString())}
            </div>
          </div>
        </div>

        <div className="flex justify-end shrink-0">
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Pencil size={14} /> Edit Expense
          </button>
        </div>
      </div>
    </Modal>
  );
}

const inputCls = 'border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';

export default function Expenses() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<'create' | Expense | null>(null);
  const [detail, setDetail] = useState<Expense | null>(null);

  const [filters, setFilters] = useState({
    status: '', vendor: '', from: '', to: '', category_id: '', min_amount: '', max_amount: '',
  });

  const set = (key: keyof typeof filters) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFilters(f => ({ ...f, [key]: e.target.value }));

  const activeFilters = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));

  const { data = [] } = useQuery({
    queryKey: ['expenses', filters],
    queryFn: () => api.list(Object.keys(activeFilters).length ? activeFilters : undefined),
  });

  const { data: categories = [] } = useQuery({ queryKey: ['expense-categories'], queryFn: () => api.categories() });

  const create = useMutation({
    mutationFn: async ({ data, file }: { data: any; file?: File }) => {
      const expense = await api.create(data);
      if (file) await api.uploadReceipt(expense.id, file);
      return expense;
    },
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
    { key: 'id',       header: 'ID',       render: (r: Expense) => r.id },
    { key: 'date',     header: 'Date',     render: (r: Expense) => r.date?.slice(0, 10) },
    { key: 'vendor',   header: 'Vendor',   render: (r: Expense) => r.vendor ?? '—' },
    { key: 'currency', header: 'Currency', render: (r: Expense) => r.currency },
    { key: 'net',      header: 'Net',      render: (r: Expense) => fmt(r.amount) },
    { key: 'vat',      header: 'VAT',      render: (r: Expense) => fmt(r.vat_amount) },
    { key: 'gross',    header: 'Gross',    render: (r: Expense) => fmt(r.gross_amount) },
    { key: 'category', header: 'Category', render: (r: Expense) => r.category?.name ?? 'Uncategorised' },
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
        <div className="flex flex-wrap gap-2 items-center">
          <input value={filters.vendor} onChange={set('vendor')} placeholder="Vendor" className={inputCls} />
          <input value={filters.from} onChange={set('from')} type="date" className={inputCls} title="From date" />
          <input value={filters.to} onChange={set('to')} type="date" className={inputCls} title="To date" />
          <select value={filters.category_id} onChange={set('category_id')} className={inputCls}>
            <option value="">All categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input value={filters.min_amount} onChange={set('min_amount')} type="number" min="0" step="0.01" placeholder="Min price" className={`${inputCls} w-28`} />
          <input value={filters.max_amount} onChange={set('max_amount')} type="number" min="0" step="0.01" placeholder="Max price" className={`${inputCls} w-28`} />
          <div className="flex gap-1">
            {['', ...STATUSES].map(s => (
              <button key={s} onClick={() => setFilters(f => ({ ...f, status: s }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${filters.status === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'}`}>
                {s || 'All'}
              </button>
            ))}
          </div>
          {Object.values(filters).some(v => v !== '') && (
            <button onClick={() => setFilters({ status: '', vendor: '', from: '', to: '', category_id: '', min_amount: '', max_amount: '' })}
              className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 underline">
              Clear
            </button>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <Table
            columns={columns}
            data={data as unknown as Record<string, unknown>[]}
            onRowClick={(row) => setDetail(row as unknown as Expense)}
          />
        </div>
      </div>

      {detail && !modal && (
        <ExpenseDetail
          expense={detail}
          onClose={() => setDetail(null)}
          onEdit={() => { setModal(detail); setDetail(null); }}
          onUpdate={setDetail}
        />
      )}

      {modal && (
        <Modal title={modal === 'create' ? 'New Expense' : 'Edit Expense'} onClose={() => setModal(null)} wide>
          <ExpenseForm
            initial={modal !== 'create' ? modal : undefined}
            onSave={(d, file) => modal === 'create'
              ? create.mutate({ data: d, file })
              : update.mutate({ ...d, id: (modal as Expense).id })}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  );
}
