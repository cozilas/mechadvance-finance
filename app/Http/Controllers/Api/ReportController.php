<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\Invoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function summary(Request $request): JsonResponse
    {
        $from = $request->from ?? now()->startOfYear()->toDateString();
        $to   = $request->to   ?? now()->toDateString();

        $revenue = Invoice::where('status', 'paid')
            ->whereBetween('issue_date', [$from, $to])
            ->sum('total');

        $outstanding = Invoice::whereIn('status', ['sent', 'overdue'])
            ->whereBetween('issue_date', [$from, $to])
            ->sum('total');

        $expenses = Expense::where('status', 'approved')
            ->whereBetween('date', [$from, $to])
            ->sum('amount');

        return response()->json([
            'period'      => ['from' => $from, 'to' => $to],
            'revenue'     => (float) $revenue,
            'outstanding' => (float) $outstanding,
            'expenses'    => (float) $expenses,
            'total_costs' => (float) $expenses,
            'profit'      => (float) ($revenue - $expenses),
        ]);
    }

    public function revenueByMonth(Request $request): JsonResponse
    {
        $year = $request->year ?? now()->year;

        $rows = Invoice::where('status', 'paid')
            ->whereYear('issue_date', $year)
            ->selectRaw("strftime('%m', issue_date) as month, SUM(total) as total")
            ->groupByRaw("strftime('%m', issue_date)")
            ->orderByRaw("strftime('%m', issue_date)")
            ->get()
            ->keyBy('month');

        $months = [];
        for ($m = 1; $m <= 12; $m++) {
            $key = str_pad($m, 2, '0', STR_PAD_LEFT);
            $months[] = [
                'month' => $key,
                'total' => (float) ($rows[$key]->total ?? 0),
            ];
        }

        return response()->json(['year' => $year, 'data' => $months]);
    }

    public function expensesByCategory(Request $request): JsonResponse
    {
        $from = $request->from ?? now()->startOfYear()->toDateString();
        $to   = $request->to   ?? now()->toDateString();

        $data = Expense::with('category')
            ->where('status', 'approved')
            ->whereBetween('date', [$from, $to])
            ->selectRaw('category_id, SUM(amount) as total')
            ->groupBy('category_id')
            ->get()
            ->map(fn($row) => [
                'category' => $row->category?->name ?? 'Uncategorised',
                'color'    => $row->category?->color ?? '#6B7280',
                'total'    => (float) $row->total,
            ]);

        return response()->json(['period' => ['from' => $from, 'to' => $to], 'data' => $data]);
    }

    public function invoiceAging(): JsonResponse
    {
        $buckets = [
            'current'  => [0, 30],
            '31_60'    => [31, 60],
            '61_90'    => [61, 90],
            'over_90'  => [91, PHP_INT_MAX],
        ];

        $unpaid = Invoice::whereIn('status', ['sent', 'overdue'])->get();

        $result = [];
        foreach ($buckets as $label => [$min, $max]) {
            $result[$label] = $unpaid
                ->filter(fn($inv) => $inv->due_date->diffInDays(now(), false) >= $min
                    && $inv->due_date->diffInDays(now(), false) <= $max)
                ->sum('total');
        }

        return response()->json($result);
    }

    public function expensesByMonth(Request $request): JsonResponse
    {
        $year = $request->year ?? now()->year;

        $rows = Expense::where('status', 'approved')
            ->whereYear('date', $year)
            ->selectRaw("strftime('%m', date) as month, SUM(amount) as total")
            ->groupByRaw("strftime('%m', date)")
            ->orderByRaw("strftime('%m', date)")
            ->get()
            ->keyBy('month');

        $months = [];
        for ($m = 1; $m <= 12; $m++) {
            $key = str_pad($m, 2, '0', STR_PAD_LEFT);
            $months[] = [
                'month' => $key,
                'total' => (float) ($rows[$key]->total ?? 0),
            ];
        }

        return response()->json(['year' => $year, 'data' => $months]);
    }
}
