import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { clients as api } from '../api';
import type { Client } from '../types';
import PageHeader from '../components/PageHeader';
import Table from '../components/Table';
import Modal from '../components/Modal';

type FormData = Omit<Client, 'id' | 'created_at' | 'updated_at'>;

function ClientForm({ initial, onSave, onClose }: {
  initial?: Partial<Client>;
  onSave: (d: FormData) => void;
  onClose: () => void;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: initial as FormData,
  });

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
          <input {...register('name', { required: true })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {errors.name && <p className="text-xs text-red-500 mt-1">Required</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
          <input {...register('email')} type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
          <input {...register('phone')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
          <input {...register('address')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
          <input {...register('city')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Country</label>
          <input {...register('country')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Tax / VAT Number</label>
          <input {...register('tax_number')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
        <button type="submit" className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700">Save</button>
      </div>
    </form>
  );
}

export default function Clients() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<'create' | Client | null>(null);

  const { data = [] } = useQuery({ queryKey: ['clients'], queryFn: () => api.list() });

  const create = useMutation({
    mutationFn: (d: FormData) => api.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clients'] }); setModal(null); },
  });
  const update = useMutation({
    mutationFn: ({ id, ...d }: FormData & { id: number }) => api.update(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clients'] }); setModal(null); },
  });
  const remove = useMutation({
    mutationFn: (id: number) => api.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });

  const columns = [
    { key: 'name',    header: 'Name' },
    { key: 'email',   header: 'Email',   render: (r: Client) => r.email ?? '—' },
    { key: 'phone',   header: 'Phone',   render: (r: Client) => r.phone ?? '—' },
    { key: 'city',    header: 'City',    render: (r: Client) => [r.city, r.country].filter(Boolean).join(', ') || '—' },
    { key: 'tax_number', header: 'VAT', render: (r: Client) => r.tax_number ?? '—' },
    {
      key: 'actions', header: '',
      render: (r: Client) => (
        <div className="flex gap-2 justify-end" onClick={e => e.stopPropagation()}>
          <button onClick={() => setModal(r)} className="text-gray-400 hover:text-blue-600"><Pencil size={14} /></button>
          <button onClick={() => confirm('Delete client?') && remove.mutate(r.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle={`${data.length} total`}
        action={
          <button onClick={() => setModal('create')} className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700">
            <Plus size={15} /> New Client
          </button>
        }
      />
      <div className="p-8">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <Table columns={columns} data={data as unknown as Record<string, unknown>[]} />
        </div>
      </div>

      {modal && (
        <Modal
          title={modal === 'create' ? 'New Client' : 'Edit Client'}
          onClose={() => setModal(null)}
        >
          <ClientForm
            initial={modal !== 'create' ? modal : undefined}
            onSave={(d) => modal === 'create' ? create.mutate(d) : update.mutate({ ...d, id: (modal as Client).id })}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  );
}
