<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ExpenseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $expenses = Expense::with('category')
            ->when($request->vendor, fn($q) => $q->where('vendor', 'like', '%' . $request->vendor . '%'))
            ->when($request->category_id, fn($q) => $q->where('category_id', $request->category_id))
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->from, fn($q) => $q->whereDate('date', '>=', $request->from))
            ->when($request->to, fn($q) => $q->whereDate('date', '<=', $request->to))
            ->when($request->min_amount, fn($q) => $q->where('amount', '>=', $request->min_amount))
            ->when($request->max_amount, fn($q) => $q->where('amount', '<=', $request->max_amount))
            ->orderByDesc('date')
            ->get();

        return response()->json($expenses);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'category_id' => 'nullable|exists:expense_categories,id',
            'description' => 'required|string|max:255',
            'vendor'      => 'nullable|string|max:255',
            'amount'      => 'required|numeric|min:0',
            'vat_rate'    => 'nullable|numeric|min:0|max:100',
            'currency'    => 'string|size:3',
            'date'        => 'required|date',
            'status'      => 'in:pending,approved,rejected',
            'notes'       => 'nullable|string',
        ]);

        $expense = Expense::create($data);

        return response()->json($expense->load('category'), 201);
    }

    public function show(Expense $expense): JsonResponse
    {
        return response()->json($expense->load('category'));
    }

    public function update(Request $request, Expense $expense): JsonResponse
    {
        $data = $request->validate([
            'category_id' => 'nullable|exists:expense_categories,id',
            'description' => 'sometimes|string|max:255',
            'vendor'      => 'nullable|string|max:255',
            'amount'      => 'sometimes|numeric|min:0',
            'vat_rate'    => 'nullable|numeric|min:0|max:100',
            'currency'    => 'sometimes|string|size:3',
            'date'        => 'sometimes|date',
            'status'      => 'sometimes|in:pending,approved,rejected',
            'notes'       => 'nullable|string',
        ]);

        $expense->update($data);

        return response()->json($expense->load('category'));
    }

    public function destroy(Expense $expense): JsonResponse
    {
        if ($expense->receipt_path) {
            Storage::disk('public')->delete($expense->receipt_path);
        }

        $expense->delete();

        return response()->json(null, 204);
    }

    public function uploadReceipt(Request $request, Expense $expense): JsonResponse
    {
        $request->validate(['receipt' => 'required|file|mimes:jpeg,jpg,png,webp,pdf|max:10240']);

        if ($expense->receipt_path) {
            Storage::disk('public')->delete($expense->receipt_path);
        }

        $path = $request->file('receipt')->store('receipts', 'public');
        $expense->update(['receipt_path' => $path]);

        return response()->json($expense->load('category'));
    }

    public function deleteReceipt(Expense $expense): JsonResponse
    {
        if ($expense->receipt_path) {
            Storage::disk('public')->delete($expense->receipt_path);
            $expense->update(['receipt_path' => null]);
        }

        return response()->json($expense->load('category'));
    }

    public function categories(): JsonResponse
    {
        return response()->json(ExpenseCategory::orderBy('name')->get());
    }

    public function storeCategory(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'  => 'required|string|max:100',
            'color' => 'nullable|string|max:20',
        ]);

        $category = ExpenseCategory::create($data);

        return response()->json($category, 201);
    }
}
