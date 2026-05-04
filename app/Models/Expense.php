<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class Expense extends Model
{
    protected $fillable = [
        'category_id', 'description', 'vendor', 'amount', 'vat_rate',
        'currency', 'date', 'status', 'notes', 'receipt_path',
    ];

    protected $casts = [
        'date'     => 'date',
        'amount'   => 'decimal:2',
        'vat_rate' => 'decimal:2',
    ];

    protected $appends = ['vat_amount', 'gross_amount', 'receipt_url'];

    public function getVatAmountAttribute(): string
    {
        return number_format((float) $this->amount * (float) $this->vat_rate / 100, 2, '.', '');
    }

    public function getGrossAmountAttribute(): string
    {
        return number_format((float) $this->amount + (float) $this->getVatAmountAttribute(), 2, '.', '');
    }

    public function getReceiptUrlAttribute(): ?string
    {
        return $this->receipt_path ? Storage::url($this->receipt_path) : null;
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(ExpenseCategory::class, 'category_id');
    }
}
