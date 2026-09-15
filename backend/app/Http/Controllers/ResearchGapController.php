<?php

namespace App\Http\Controllers;

use App\Models\ResearchGapAnalysis;
use App\Models\SearchHistory;
use App\Services\ActivityLogger;
use App\Services\AiClientService;
use App\Services\ResearchGapService;
use App\Services\SystemLogger;
use Illuminate\Http\Request;

class ResearchGapController extends Controller
{
    public function __construct(
        protected ResearchGapService $gapService,
        protected AiClientService $ai,
    ) {}

    /**
     * GET /api/research-gaps/status
     * Lets the frontend know whether the AI feature is usable right now
     * (i.e. whether an AI_API_KEY has been configured on the backend).
     */
    public function status()
    {
        return response()->json([
            'available' => $this->gapService->isAvailable(),
            'provider' => $this->ai->providerName(),
        ]);
    }

    /**
     * POST /api/research-gaps
     * body: { search_history_id: int }
     *
     * Runs an AI analysis over the papers found in one of the user's past
     * searches and returns a set of identified research gaps.
     */
    public function analyze(Request $request)
    {
        if (!$this->gapService->isAvailable()) {
            return response()->json([
                'message' => 'AI Research Gap Finder is not configured yet. Ask the site admin to add an AI_API_KEY in the backend .env file.',
            ], 503);
        }

        $validated = $request->validate([
            'search_history_id' => 'required|integer|exists:search_histories,id',
        ]);

        $history = SearchHistory::where('id', $validated['search_history_id'])
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$history) {
            return response()->json(['message' => 'Search history not found.'], 404);
        }

        $papers = $history->results ?? [];

        if (count($papers) < 2) {
            return response()->json([
                'message' => 'Need at least 2 papers in this search to find meaningful gaps.',
            ], 422);
        }

        try {
            $result = $this->gapService->analyze($history->prompt, $papers);
        } catch (\Throwable $e) {
            SystemLogger::error('Research gap analysis failed', ['message' => $e->getMessage()]);
            return response()->json([
                'message' => 'The AI analysis failed: ' . $e->getMessage(),
            ], 502);
        }

        $analysis = ResearchGapAnalysis::create([
            'user_id' => $request->user()->id,
            'search_history_id' => $history->id,
            'topic' => $history->prompt,
            'papers_analyzed' => min(count($papers), 15),
            'gaps' => $result['gaps'],
            'overview' => $result['overview'],
            'ai_provider' => $this->ai->providerName(),
            'ai_model' => $this->ai->modelName(),
        ]);

        ActivityLogger::log(
            $request->user()->id,
            'research_gap_analysis',
            "Ran AI gap analysis for \"{$history->prompt}\" — " . count($result['gaps']) . ' gaps found'
        );

        return response()->json($analysis);
    }

    /**
     * GET /api/research-gaps
     * The logged-in user's past gap analyses.
     */
    public function index(Request $request)
    {
        $analyses = ResearchGapAnalysis::where('user_id', $request->user()->id)
            ->latest()
            ->paginate(10);

        return response()->json($analyses);
    }

    /**
     * GET /api/research-gaps/{researchGapAnalysis}
     */
    public function show(Request $request, ResearchGapAnalysis $researchGapAnalysis)
    {
        if ($researchGapAnalysis->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        return response()->json($researchGapAnalysis);
    }
}
