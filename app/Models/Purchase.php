<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Purchase extends Model
{
    protected $fillable = [
        'number', 'supplier_id', 'order_date', 'expected_date', 'received_date',
        'status', 'subtotal', 'tax_rate', 'tax_amount', 'discount', 'total',
        'currency', 'notes',
    ];

    protected $casts = [
        'order_date'    => 'date',
        'expected_date' => 'date',
        'received_date' => 'date',
        'subtotal'      => 'decimal:2',
        'tax_rate'      => 'decimal:2',
        'tax_amount'    => 'decimal:2',
        'discount'      => 'decimal:2',
        'total'         => 'decimal:2',
    ];

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PurchaseItem::class);
    }

    public function recalculate(): void
    {
        $this->subtotal = $this->items()->sum('total');
        $this->tax_amount = round($this->subtotal * $this->tax_rate / 100, 2);
        $this->total = $this->subtotal + $this->tax_amount - $this->discount;
        $this->save();
    }
}
