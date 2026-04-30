<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Quotation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class QuotationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $quotations = Quotation::with('client')
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->client_id, fn($q) => $q->where('client_id', $request->client_id))
            ->when($request->from, fn($q) => $q->whereDate('issue_date', '>=', $request->from))
            ->when($request->to, fn($q) => $q->whereDate('issue_date', '<=', $request->to))
            ->orderByDesc('issue_date')
            ->get();

        return response()->json($quotations);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'client_id'   => 'required|exists:clients,id',
            'issue_date'  => 'required|date',
            'valid_until' => 'required|date|after_or_equal:issue_date',
            'status'      => 'in:draft,sent,accepted,rejected,expired,converted',
            'tax_rate'    => 'numeric|min:0|max:100',
            'discount'    => 'numeric|min:0',
            'currency'    => 'string|size:3',
            'notes'       => 'nullable|string',
            'items'       => 'required|array|min:1',
            'items.*.description' => 'required|string',
            'items.*.quantity'    => 'required|numeric|min:0.01',
            'items.*.unit_price'  => 'required|numeric|min:0',
        ]);

        $data['number'] = 'QUO-' . strtoupper(Str::random(8));
        $data['tax_rate'] = $data['tax_rate'] ?? 0;
        $data['discount'] = $data['discount'] ?? 0;

        $quotation = Quotation::create($data);

        foreach ($data['items'] as $item) {
            $item['total'] = round($item['quantity'] * $item['unit_price'], 2);
            $quotation->items()->create($item);
        }

        $quotation->recalculate();

        return response()->json($quotation->load(['client', 'items']), 201);
    }

    public function show(Quotation $quotation): JsonResponse
    {
        return response()->json($quotation->load(['client', 'items', 'invoice']));
    }

    public function update(Request $request, Quotation $quotation): JsonResponse
    {
        $data = $request->validate([
            'client_id'   => 'sometimes|exists:clients,id',
            'issue_date'  => 'sometimes|date',
            'valid_until' => 'sometimes|date',
            'status'      => 'sometimes|in:draft,sent,accepted,rejected,expired,converted',
            'tax_rate'    => 'sometimes|numeric|min:0|max:100',
            'discount'    => 'sometimes|numeric|min:0',
            'currency'    => 'sometimes|string|size:3',
            'notes'       => 'nullable|string',
            'items'       => 'sometimes|array|min:1',
            'items.*.description' => 'required_with:items|string',
            'items.*.quantity'    => 'required_with:items|numeric|min:0.01',
            'items.*.unit_price'  => 'required_with:items|numeric|min:0',
        ]);

        $quotation->update($data);

        if (isset($data['items'])) {
            $quotation->items()->delete();
            foreach ($data['items'] as $item) {
                $item['total'] = round($item['quantity'] * $item['unit_price'], 2);
                $quotation->items()->create($item);
            }
            $quotation->recalculate();
        }

        return response()->json($quotation->load(['client', 'items']));
    }

    public function destroy(Quotation $quotation): JsonResponse
    {
        $quotation->delete();

        return response()->json(null, 204);
    }

    public function convert(Quotation $quotation): JsonResponse
    {
        if ($quotation->status === 'converted') {
            return response()->json(['message' => 'Quotation already converted'], 422);
        }

        $invoice = Invoice::create([
            'number'     => 'INV-' . strtoupper(Str::random(8)),
            'client_id'  => $quotation->client_id,
            'issue_date' => now()->toDateString(),
            'due_date'   => now()->addDays(30)->toDateString(),
            'status'     => 'draft',
            'tax_rate'   => $quotation->tax_rate,
            'discount'   => $quotation->discount,
            'currency'   => $quotation->currency,
            'notes'      => $quotation->notes,
        ]);

        foreach ($quotation->items as $item) {
            $invoice->items()->create([
                'description' => $item->description,
                'quantity'    => $item->quantity,
                'unit_price'  => $item->unit_price,
                'total'       => $item->total,
            ]);
        }

        $invoice->recalculate();

        $quotation->update(['status' => 'converted', 'invoice_id' => $invoice->id]);

        return response()->json($invoice->load(['client', 'items']), 201);
    }
}
