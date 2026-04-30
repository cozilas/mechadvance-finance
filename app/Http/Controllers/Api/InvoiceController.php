<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class InvoiceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $invoices = Invoice::with('client')
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->client_id, fn($q) => $q->where('client_id', $request->client_id))
            ->when($request->from, fn($q) => $q->whereDate('issue_date', '>=', $request->from))
            ->when($request->to, fn($q) => $q->whereDate('issue_date', '<=', $request->to))
            ->orderByDesc('issue_date')
            ->get();

        return response()->json($invoices);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'client_id'  => 'required|exists:clients,id',
            'issue_date' => 'required|date',
            'due_date'   => 'required|date|after_or_equal:issue_date',
            'status'     => 'in:draft,sent,paid,overdue,cancelled',
            'tax_rate'   => 'numeric|min:0|max:100',
            'discount'   => 'numeric|min:0',
            'currency'   => 'string|size:3',
            'notes'      => 'nullable|string',
            'items'      => 'required|array|min:1',
            'items.*.description' => 'required|string',
            'items.*.quantity'    => 'required|numeric|min:0.01',
            'items.*.unit_price'  => 'required|numeric|min:0',
        ]);

        $data['number'] = 'INV-' . strtoupper(Str::random(8));
        $data['tax_rate'] = $data['tax_rate'] ?? 0;
        $data['discount'] = $data['discount'] ?? 0;

        $invoice = Invoice::create($data);

        foreach ($data['items'] as $item) {
            $item['total'] = round($item['quantity'] * $item['unit_price'], 2);
            $invoice->items()->create($item);
        }

        $invoice->recalculate();

        return response()->json($invoice->load(['client', 'items']), 201);
    }

    public function show(Invoice $invoice): JsonResponse
    {
        return response()->json($invoice->load(['client', 'items']));
    }

    public function update(Request $request, Invoice $invoice): JsonResponse
    {
        $data = $request->validate([
            'client_id'  => 'sometimes|exists:clients,id',
            'issue_date' => 'sometimes|date',
            'due_date'   => 'sometimes|date',
            'status'     => 'sometimes|in:draft,sent,paid,overdue,cancelled',
            'tax_rate'   => 'sometimes|numeric|min:0|max:100',
            'discount'   => 'sometimes|numeric|min:0',
            'currency'   => 'sometimes|string|size:3',
            'notes'      => 'nullable|string',
            'items'      => 'sometimes|array|min:1',
            'items.*.description' => 'required_with:items|string',
            'items.*.quantity'    => 'required_with:items|numeric|min:0.01',
            'items.*.unit_price'  => 'required_with:items|numeric|min:0',
        ]);

        $invoice->update($data);

        if (isset($data['items'])) {
            $invoice->items()->delete();
            foreach ($data['items'] as $item) {
                $item['total'] = round($item['quantity'] * $item['unit_price'], 2);
                $invoice->items()->create($item);
            }
            $invoice->recalculate();
        }

        return response()->json($invoice->load(['client', 'items']));
    }

    public function destroy(Invoice $invoice): JsonResponse
    {
        $invoice->delete();

        return response()->json(null, 204);
    }
}
