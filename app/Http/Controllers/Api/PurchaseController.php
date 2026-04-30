<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Purchase;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PurchaseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $purchases = Purchase::with('supplier')
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->supplier_id, fn($q) => $q->where('supplier_id', $request->supplier_id))
            ->when($request->from, fn($q) => $q->whereDate('order_date', '>=', $request->from))
            ->when($request->to, fn($q) => $q->whereDate('order_date', '<=', $request->to))
            ->orderByDesc('order_date')
            ->get();

        return response()->json($purchases);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'supplier_id'   => 'required|exists:suppliers,id',
            'order_date'    => 'required|date',
            'expected_date' => 'nullable|date|after_or_equal:order_date',
            'status'        => 'in:draft,ordered,received,paid,cancelled',
            'tax_rate'      => 'numeric|min:0|max:100',
            'discount'      => 'numeric|min:0',
            'currency'      => 'string|size:3',
            'notes'         => 'nullable|string',
            'items'         => 'required|array|min:1',
            'items.*.description' => 'required|string',
            'items.*.quantity'    => 'required|numeric|min:0.01',
            'items.*.unit_price'  => 'required|numeric|min:0',
        ]);

        $data['number'] = 'PO-' . strtoupper(Str::random(8));
        $data['tax_rate'] = $data['tax_rate'] ?? 0;
        $data['discount'] = $data['discount'] ?? 0;

        $purchase = Purchase::create($data);

        foreach ($data['items'] as $item) {
            $item['total'] = round($item['quantity'] * $item['unit_price'], 2);
            $purchase->items()->create($item);
        }

        $purchase->recalculate();

        return response()->json($purchase->load(['supplier', 'items']), 201);
    }

    public function show(Purchase $purchase): JsonResponse
    {
        return response()->json($purchase->load(['supplier', 'items']));
    }

    public function update(Request $request, Purchase $purchase): JsonResponse
    {
        $data = $request->validate([
            'supplier_id'   => 'sometimes|exists:suppliers,id',
            'order_date'    => 'sometimes|date',
            'expected_date' => 'nullable|date',
            'received_date' => 'nullable|date',
            'status'        => 'sometimes|in:draft,ordered,received,paid,cancelled',
            'tax_rate'      => 'sometimes|numeric|min:0|max:100',
            'discount'      => 'sometimes|numeric|min:0',
            'currency'      => 'sometimes|string|size:3',
            'notes'         => 'nullable|string',
            'items'         => 'sometimes|array|min:1',
            'items.*.description' => 'required_with:items|string',
            'items.*.quantity'    => 'required_with:items|numeric|min:0.01',
            'items.*.unit_price'  => 'required_with:items|numeric|min:0',
        ]);

        $purchase->update($data);

        if (isset($data['items'])) {
            $purchase->items()->delete();
            foreach ($data['items'] as $item) {
                $item['total'] = round($item['quantity'] * $item['unit_price'], 2);
                $purchase->items()->create($item);
            }
            $purchase->recalculate();
        }

        return response()->json($purchase->load(['supplier', 'items']));
    }

    public function destroy(Purchase $purchase): JsonResponse
    {
        $purchase->delete();

        return response()->json(null, 204);
    }
}
