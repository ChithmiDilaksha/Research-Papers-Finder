<?php

namespace App\Http\Controllers;

use App\Models\SearchHistory;
use App\Models\Source;
use App\Services\ActivityLogger;
use App\Services\ArxivService;
use App\Services\CrossRefService;
use App\Services\GoogleScholarService;
use App\Services\IeeeService;
use App\Services\SemanticScholarService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PaperSearchController extends Controller
{
    public function __construct(
        protected SemanticScholarService $semanticScholar,
        protected CrossRefService $crossRef,
        protected ArxivService $arxiv,
        protected IeeeService $ieee,
        protected GoogleScholarService $googleScholar,
    ) {}

    /**
     * POST /api/search   (requires auth:sanctum)
     * body: { prompt: string, limit: int (1-100), sources?: string[] }
     *
     * - "sources" are validated against the Source master table (admin
     *   managed) — only active source keys are ever queried.
     * - Every search is saved to search_histories for the logged-in user,
     *   and logged in activity_logs.
     */
    public function search(Request $request)
    {
        $activeSourceKeys = Source::where('is_active', true)->pluck('key')->all();

        $validated = $request->validate([
            'prompt' => 'required|string|min:3|max:500',
            'limit' => 'nullable|integer|min:1|max:100',
            'sources' => 'nullable|array',
            'sources.*' => 'in:' . implode(',', $activeSourceKeys ?: ['_none']),
        ]);

        $prompt = $validated['prompt'];
        $limit = $validated['limit'] ?? 10;
        $sources = $validated['sources'] ?? $activeSourceKeys;

        $serviceMap = [
            'semantic_scholar' => $this->semanticScholar,
            'crossref' => $this->crossRef,
            'arxiv' => $this->arxiv,
            'ieee' => $this->ieee,
            'google_scholar' => $this->googleScholar,
        ];

        // Fetch a bit more than requested from each source so ranking has
        // a good pool of candidates to pick the top N from.
        $perSourceLimit = max($limit, 15);

        $results = collect();
        foreach ($sources as $sourceKey) {
            if (isset($serviceMap[$sourceKey])) {
                $results = $results->concat($serviceMap[$sourceKey]->search($prompt, $perSourceLimit));
            }
        }

        // Remove duplicate papers (same/very similar title)
        $deduped = $results->unique(function ($paper) {
            return Str::slug(Str::limit($paper['title'], 60, ''));
        });

        // Ranking weight per source comes from the admin-editable master table.
        $sourceWeights = Source::pluck('priority_weight', 'name')->all();

        $currentYear = (int) date('Y');

        $ranked = $deduped->map(function ($paper) use ($sourceWeights, $currentYear) {
            $citationScore = min((int) $paper['citationCount'], 500) / 5; // cap influence
            $sourceScore = $sourceWeights[$paper['source']] ?? 5;
            $recencyScore = $paper['year'] ? max(0, 15 - ($currentYear - (int) $paper['year'])) : 0;

            $paper['priorityScore'] = round($citationScore + $sourceScore + $recencyScore, 2);
            return $paper;
        })->sortByDesc('priorityScore')->values();

        $top = $ranked->take($limit)->values()->map(function ($paper, $index) {
            $paper['rank'] = $index + 1;
            return $paper;
        });

        $responsePayload = [
            'query' => $prompt,
            'requested' => $limit,
            'found' => $top->count(),
            'totalBeforeLimit' => $deduped->count(),
            'papers' => $top,
        ];

        // Save this search to the logged-in user's history so they can
        // revisit their prompt and the papers that were found for it.
        $history = SearchHistory::create([
            'user_id' => $request->user()->id,
            'prompt' => $prompt,
            'limit_requested' => $limit,
            'sources_used' => $sources,
            'results' => $top,
            'found_count' => $top->count(),
        ]);

        ActivityLogger::log(
            $request->user()->id,
            'search',
            "Searched \"{$prompt}\" (limit {$limit}) — {$top->count()} papers found"
        );

        $responsePayload['history_id'] = $history->id;

        return response()->json($responsePayload);
    }
}
