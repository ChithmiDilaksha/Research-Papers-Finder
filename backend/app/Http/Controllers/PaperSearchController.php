<?php

namespace App\Http\Controllers;

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
     * POST /api/search
     * body: { prompt: string, limit: int, sources?: string[] }
     */
    public function search(Request $request)
    {
        $validated = $request->validate([
            'prompt' => 'required|string|min:3|max:500',
            'limit' => 'nullable|integer|min:1|max:100',
            'sources' => 'nullable|array',
            'sources.*' => 'in:semantic_scholar,crossref,arxiv,ieee,google_scholar',
        ]);

        $prompt = $validated['prompt'];
        $limit = $validated['limit'] ?? 10;
        $sources = $validated['sources'] ?? [
            'semantic_scholar', 'crossref', 'arxiv', 'ieee', 'google_scholar',
        ];

        // Fetch a bit more than requested from each source so ranking has
        // a good pool to pick the top N from.
        $perSourceLimit = max($limit, 15);

        $results = collect();

        if (in_array('semantic_scholar', $sources)) {
            $results = $results->concat($this->semanticScholar->search($prompt, $perSourceLimit));
        }
        if (in_array('crossref', $sources)) {
            $results = $results->concat($this->crossRef->search($prompt, $perSourceLimit));
        }
        if (in_array('arxiv', $sources)) {
            $results = $results->concat($this->arxiv->search($prompt, $perSourceLimit));
        }
        if (in_array('ieee', $sources)) {
            $results = $results->concat($this->ieee->search($prompt, $perSourceLimit));
        }
        if (in_array('google_scholar', $sources)) {
            $results = $results->concat($this->googleScholar->search($prompt, $perSourceLimit));
        }

        // Remove duplicate papers (same/very similar title)
        $deduped = $results->unique(function ($paper) {
            return Str::slug(Str::limit($paper['title'], 60, ''));
        });

        // Rank: score = citation weight + source trust weight + recency weight
        $sourceWeight = [
            'IEEE Xplore' => 25,
            'Semantic Scholar' => 20,
            'Google Scholar' => 20,
            'CrossRef' => 15,
            'arXiv' => 10,
        ];

        $currentYear = (int) date('Y');

        $ranked = $deduped->map(function ($paper) use ($sourceWeight, $currentYear) {
            $citationScore = min((int) $paper['citationCount'], 500) / 5; // cap influence
            $sourceScore = $sourceWeight[$paper['source']] ?? 5;
            $recencyScore = $paper['year'] ? max(0, 15 - ($currentYear - (int) $paper['year'])) : 0;

            $paper['priorityScore'] = round($citationScore + $sourceScore + $recencyScore, 2);
            return $paper;
        })->sortByDesc('priorityScore')->values();

        $top = $ranked->take($limit)->values();

        return response()->json([
            'query' => $prompt,
            'requested' => $limit,
            'found' => $top->count(),
            'totalBeforeLimit' => $deduped->count(),
            'papers' => $top->map(function ($paper, $index) {
                $paper['rank'] = $index + 1;
                return $paper;
            }),
        ]);
    }
}
