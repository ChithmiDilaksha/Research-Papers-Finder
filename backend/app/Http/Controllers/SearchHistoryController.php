<?php

namespace App\Http\Controllers;

use App\Models\SearchHistory;
use Illuminate\Http\Request;

class SearchHistoryController extends Controller
{
    /**
     * Paginated list of the logged-in user's own past searches
     * (prompt, sources used, how many papers were found, when).
     */
    public function index(Request $request)
    {
        $history = SearchHistory::where('user_id', $request->user()->id)
            ->latest()
            ->paginate(10, ['id', 'prompt', 'limit_requested', 'sources_used', 'found_count', 'created_at']);

        return response()->json($history);
    }

    /**
     * View one specific past search in full, including the complete
     * ranked list of papers that were returned at the time.
     */
    public function show(Request $request, SearchHistory $searchHistory)
    {
        if ($searchHistory->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        return response()->json($searchHistory);
    }
}
