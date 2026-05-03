<?php

use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\QuotationController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SupplierController;
use Illuminate\Support\Facades\Route;

Route::apiResource('clients', ClientController::class);

Route::apiResource('invoices', InvoiceController::class);

Route::apiResource('quotations', QuotationController::class);
Route::post('quotations/{quotation}/convert', [QuotationController::class, 'convert']);

Route::apiResource('expenses', ExpenseController::class);
Route::get('expense-categories', [ExpenseController::class, 'categories']);
Route::post('expense-categories', [ExpenseController::class, 'storeCategory']);

Route::apiResource('suppliers', SupplierController::class);

Route::prefix('reports')->group(function () {
    Route::get('summary', [ReportController::class, 'summary']);
    Route::get('revenue-by-month', [ReportController::class, 'revenueByMonth']);
    Route::get('expenses-by-month', [ReportController::class, 'expensesByMonth']);
    Route::get('expenses-by-category', [ReportController::class, 'expensesByCategory']);
    Route::get('invoice-aging', [ReportController::class, 'invoiceAging']);
});
