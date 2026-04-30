import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Pencil, Trash2, Eye, ArrowRight } from 'lucide-react';
import { quotations as api, clients as clientsApi } from '../api';
import type { Quotation, QuotationStatus } from '../types';
import PageHeader from '../components/PageHeader';
import Table from '../components/Table';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import LineItemsEditor from '../components/LineItemsEditor';

const STATUSES: QuotationStatus[] = ['draft', 'sent', 'accepted', 'rejected', 'expired', 'converted'];
const fmt = (n: number | string) => `€${parseFloat(String(n)).toFixed(2)}`;

function QuotationForm({ initial, onSave, onClose }: {
  initial?: Partial<Quotation>;
  onSave: (d: any) => void;
  onClose: () => void;
}) {
  const { data: clientList = [] } = useQuery({ queryKey: ['clients'], queryFn: () => clientsApi.list() });
  const { register, handleSubmit, control, watch } = useForm({
    defaultValues: {
      client_id: initial?.client_id ?? '',
      issue_date: initial?.issue_date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      valid_until: initial?.valid_until?.slice(0, 10) ?? '',
      status: initial?.status ?? 'draft',
      tax_rate: initial?.tax_rate ?? 0,
      discount: initial?.discount ?? 0,
      currency: initial?.currency ?? 'EUR',
      notes: initial?.notes ?? '',
      items: initial?.items ?? [{ description: '', quantity: 1, unit_price: 0 }],
    },
  });

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">Client *</label>
          <select {...register('client_id', { required: true })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select client…</option>
            {clientList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Issue Date *</label>
          <input {...register('issue_date', { required: true })} type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Valid Until *</label>
          <input {...register('valid_until', { required: true })} type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
          <select {...register('status')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Currency</label>
          <input {...register('currency')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Tax Rate (%)</label>
          <input {...register('tax_rate')} type="number" step="0.01" min="0" max="100" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Discount (€)</label>
          <input {...register('discount')} type="number" step="0.01" min="0" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">Line Items</label>
        <LineItemsEditor control={control} register={register} watch={watch} />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
        <textarea {...register('notes')} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
        <button type="submit" className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700">Save</button>
      </div>
    </form>
  );
}

export default function Quotations() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<'create' | Quotation | 'view' | null>(null);
  const [viewing, setViewing] = useState<Quotation | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const { data = [] } = useQuery({
    queryKey: ['quotations', statusFilter],
    queryFn: () => api.list(statusFilter ? { status: statusFilter } : undefined),
  });

  const { data: detail } = useQuery({
    queryKey: ['quotation', viewing?.id],
    queryFn: () => api.get(viewing!.id),
    enabled: !!viewing,
  });

  const create = useMutation({
    mutationFn: (d: any) => api.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['quotations'] }); setModal(null); },
  });
  const update = useMutation({
    mutationFn: ({ id, ...d }: any) => api.update(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['quotations'] }); setModal(null); },
  });
  const remove = useMutation({
    mutationFn: (id: number) => api.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quotations'] }),
  });
  const convert = useMutation({
    mutationFn: (id: number) => api.convert(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['quotations'] }); qc.invalidateQueries({ queryKey: ['invoices'] }); setModal(null); setViewing(null); },
  });

  const columns = [
    { key: 'number',      header: 'Number' },
    { key: 'client',      header: 'Client',       render: (r: Quotation) => r.client?.name ?? '—' },
    { key: 'issue_date',  header: 'Issued',        render: (r: Quotation) => r.issue_date?.slice(0, 10) },
    { key: 'valid_until', header: 'Valid Until',   render: (r: Quotation) => r.valid_until?.slice(0, 10) },
    { key: 'total',       header: 'Total',         render: (r: Quotation) => fmt(r.total) },
    { key: 'status',      header: 'Status',        render: (r: Quotation) => <StatusBadge status={r.status} /> },
    {
      key: 'actions', header: '',
      render: (r: Quotation) => (
        <div className="flex gap-2 justify-end" onClick={e => e.stopPropagation()}>
          <button onClick={() => { setViewing(r); setModal('view'); }} className="text-gray-400 hover:text-blue-600"><Eye size={14} /></button>
          {r.status !== 'converted' && (
            <button onClick={() => confirm('Convert to invoice?') && convert.mutate(r.id)} className="text-gray-400 hover:text-green-600" title="Convert to invoice"><ArrowRight size={14} /></button>
          )}
          <button onClick={() => setModal(r)} className="text-gray-400 hover:text-blue-600"><Pencil size={14} /></button>
          <button onClick={() => confirm('Delete quotation?') && remove.mutate(r.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Quotations"
        subtitle={`${data.length} records`}
        action={
          <button onClick={() => setModal('create')} className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700">
            <Plus size={15} /> New Quotation
          </button>
        }
      />
      <div className="p-8 space-y-4">
        <div className="flex gap-2 flex-wrap">
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

      {modal === 'create' && (
        <Modal title="New Quotation" onClose={() => setModal(null)} wide>
          <QuotationForm onSave={(d) => create.mutate(d)} onClose={() => setModal(null)} />
        </Modal>
      )}
      {modal && modal !== 'create' && modal !== 'view' && (
        <Modal title="Edit Quotation" onClose={() => setModal(null)} wide>
          <QuotationForm initial={modal as Quotation} onSave={(d) => update.mutate({ ...d, id: (modal as Quotation).id })} onClose={() => setModal(null)} />
        </Modal>
      )}
      {modal === 'view' && detail && (
        <Modal title={`Quotation ${detail.number}`} onClose={() => { setModal(null); setViewing(null); }} wide>
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-gray-500">Client:</span> <span className="font-medium">{detail.client?.name}</span></div>
              <div><span className="text-gray-500">Status:</span> <StatusBadge status={detail.status} /></div>
              <div><span className="text-gray-500">Issued:</span> {detail.issue_date?.slice(0, 10)}</div>
              <div><span className="text-gray-500">Valid Until:</span> {detail.valid_until?.slice(0, 10)}</div>
            </div>
            <table className="w-full text-sm border-t border-gray-100 mt-2">
              <thead><tr className="text-xs text-gray-500 border-b border-gray-100">
                <th className="text-left py-2">Description</th><th className="text-right py-2">Qty</th><th className="text-right py-2">Unit Price</th><th className="text-right py-2">Total</th>
              </tr></thead>
              <tbody>
                {detail.items?.map((item, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-2">{item.description}</td><td className="text-right py-2">{item.quantity}</td><td className="text-right py-2">{fmt(item.unit_price)}</td><td className="text-right py-2">{fmt(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end gap-6 text-sm pt-2">
              <div>Subtotal: <span className="font-medium">{fmt(detail.subtotal)}</span></div>
              <div>Tax ({detail.tax_rate}%): <span className="font-medium">{fmt(detail.tax_amount)}</span></div>
              <div className="text-base font-semibold">Total: {fmt(detail.total)}</div>
            </div>
            {detail.status !== 'converted' && (
              <div className="flex justify-end pt-2">
                <button onClick={() => convert.mutate(detail.id)} className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700">
                  <ArrowRight size={15} /> Convert to Invoice
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
