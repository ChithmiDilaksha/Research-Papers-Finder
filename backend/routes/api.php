<?php

use App\Http\Controllers\Admin\LogController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\PaperSearchController;
use App\Http\Controllers\SearchHistoryController;
use App\Http\Controllers\SourceController;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json(['status' => 'ok']);
});

// ---- Auth (public) ----
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// ---- Authenticated (any logged-in user) ----
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Search
    Route::post('/search', [PaperSearchController::class, 'search']);

    // Master "sources to search" list, shown to every logged-in user
    // when picking which databases to search.
    Route::get('/sources', [SourceController::class, 'index']);

    // A logged-in user's own search prompts + the papers found for them.
    Route::get('/search-history', [SearchHistoryController::class, 'index']);
    Route::get('/search-history/{searchHistory}', [SearchHistoryController::class, 'show']);
});

// ---- Admin only ----
Route::middleware(['auth:sanctum', 'is_admin'])->prefix('admin')->name('admin.')->group(function () {
    // Manage the Sources master table (add / edit / activate / deactivate)
    Route::get('/sources', [SourceController::class, 'index'])->name('sources.index');
    Route::post('/sources', [SourceController::class, 'store'])->name('sources.store');
    Route::put('/sources/{source}', [SourceController::class, 'update'])->name('sources.update');
    Route::delete('/sources/{source}', [SourceController::class, 'destroy'])->name('sources.destroy');

    // System log & activity log viewers
    Route::get('/activity-logs', [LogController::class, 'activity'])->name('activity-logs');
    Route::get('/system-logs', [LogController::class, 'system'])->name('system-logs');
});
