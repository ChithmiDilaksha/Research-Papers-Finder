<?php

use App\Http\Controllers\PaperSearchController;
use Illuminate\Support\Facades\Route;

Route::post('/search', [PaperSearchController::class, 'search']);

Route::get('/health', function () {
    return response()->json(['status' => 'ok']);
});
