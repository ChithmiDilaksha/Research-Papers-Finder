<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SemanticScholarService
{
    protected string $baseUrl = 'https://api.semanticscholar.org/graph/v1/paper/search';

    /**
     * Search papers on Semantic Scholar (free, no API key needed for basic usage).
     * Docs: https://api.semanticscholar.org/api-docs/
     */
    public function search(string $query, int $limit = 10): array
    {
        try {
            $response = Http::timeout(15)->get($this->baseUrl, [
                'query' => $query,
                'limit' => min($limit, 50),
                'fields' => 'title,abstract,url,year,authors,citationCount,venue,externalIds',
            ]);

            if (!$response->successful()) {
                Log::warning('SemanticScholar request failed', ['status' => $response->status()]);
                return [];
            }

            $data = $response->json('data', []);

            return collect($data)->map(function ($paper) {
                return [
                    'title' => $paper['title'] ?? 'Untitled',
                    'authors' => collect($paper['authors'] ?? [])->pluck('name')->implode(', '),
                    'year' => $paper['year'] ?? null,
                    'abstract' => $paper['abstract'] ?? null,
                    'url' => $paper['url'] ?? (isset($paper['externalIds']['DOI'])
                        ? 'https://doi.org/' . $paper['externalIds']['DOI']
                        : null),
                    'citationCount' => $paper['citationCount'] ?? 0,
                    'venue' => $paper['venue'] ?? null,
                    'source' => 'Semantic Scholar',
                ];
            })->filter(fn ($p) => !empty($p['url']))->values()->all();
        } catch (\Throwable $e) {
            Log::error('SemanticScholarService error: ' . $e->getMessage());
            return [];
        }
    }
}
