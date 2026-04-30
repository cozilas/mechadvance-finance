<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Quotation extends Model
{
    protected $fillable = [
        'number', 'client_id', 'issue_date', 'valid_until', 'status',
        'subtotal', 'tax_rate', 'tax_amount', 'discount', 'total',
        'currency', 'notes', 'invoice_id',
    ];

    protected $casts = [
        'issue_date' => 'date',
        'valid_until' => 'date',
        'subtotal' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(QuotationItem::class);
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function recalculate(): void
    {
        $this->subtotal = $this->items()->sum('total');
        $this->tax_amount = round($this->subtotal * $this->tax_rate / 100, 2);
        $this->total = $this->subtotal + $this->tax_amount - $this->discount;
        $this->save();
    }
}
