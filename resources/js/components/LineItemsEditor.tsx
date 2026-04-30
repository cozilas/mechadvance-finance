import { useFieldArray, Control, UseFormRegister, UseFormWatch } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';

interface Props {
  control: Control<any>;
  register: UseFormRegister<any>;
  watch: UseFormWatch<any>;
}

export default function LineItemsEditor({ control, register, watch }: Props) {
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const items = watch('items') ?? [];
  const subtotal = items.reduce((sum: number, item: any) =>
    sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0), 0);

  return (
    <div>
      <div className="space-y-2">
        <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-1">
          <span className="col-span-6">Description</span>
          <span className="col-span-2 text-right">Qty</span>
          <span className="col-span-2 text-right">Unit Price</span>
          <span className="col-span-1 text-right">Total</span>
          <span className="col-span-1" />
        </div>

        {fields.map((field, i) => {
          const qty = parseFloat(items[i]?.quantity) || 0;
          const price = parseFloat(items[i]?.unit_price) || 0;
          return (
            <div key={field.id} className="grid grid-cols-12 gap-2 items-center">
              <input
                {...register(`items.${i}.description`)}
                placeholder="Description"
                className="col-span-6 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                {...register(`items.${i}.quantity`)}
                type="number" step="0.01" min="0"
                placeholder="1"
                className="col-span-2 border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                {...register(`items.${i}.unit_price`)}
                type="number" step="0.01" min="0"
                placeholder="0.00"
                className="col-span-2 border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="col-span-1 text-sm text-right text-gray-700">
                {(qty * price).toFixed(2)}
              </span>
              <button type="button" onClick={() => remove(i)} className="col-span-1 flex justify-center text-gray-400 hover:text-red-500">
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => append({ description: '', quantity: 1, unit_price: 0 })}
        className="mt-3 flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700"
      >
        <Plus size={14} /> Add line
      </button>

      <div className="mt-4 flex justify-end">
        <div className="text-sm text-gray-700">
          Subtotal: <span className="font-semibold">€{subtotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
