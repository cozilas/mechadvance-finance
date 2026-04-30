<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Invoice extends Model
{
    protected $fillable = [
        'number', 'client_id', 'issue_date', 'due_date', 'status',
        'subtotal', 'tax_rate', 'tax_amount', 'discount', 'total',
        'currency', 'notes',
    ];

    protected $casts = [
        'issue_date' => 'date',
        'due_date' => 'date',
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
        return $this->hasMany(InvoiceItem::class);
    }

    public function quotation(): HasOne
    {
        return $this->hasOne(Quotation::class);
    }

    public function recalculate(): void
    {
        $this->subtotal = $this->items()->sum('total');
        $this->tax_amount = round($this->subtotal * $this->tax_rate / 100, 2);
        $this->total = $this->subtotal + $this->tax_amount - $this->discount;
        $this->save();
    }
}
