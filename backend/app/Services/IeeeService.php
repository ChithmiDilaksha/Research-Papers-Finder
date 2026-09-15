<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Services\SystemLogger;

class IeeeService
{
    protected string $baseUrl = 'http://ieeexploreapi.ieee.org/api/v1/search/articles';

    /**
     * Search papers on IEEE Xplore.
     * Requires a free API key from https://developer.ieee.org/
     * Add IEEE_API_KEY to your .env file to enable this source.
     */
    public function search(string $query, int $limit = 10): array
    {
        $apiKey = config('services.ieee.key');

        if (empty($apiKey)) {
            // No key configured -> silently skip this source.
            return [];
        }

        try {
            $response = Http::timeout(15)->get($this->baseUrl, [
                'apikey' => $apiKey,
                'querytext' => $query,
                'max_records' => min($limit, 50),
                'sort_order' => 'desc',
                'sort_field' => 'relevance',
            ]);

            if (!$response->successful()) {
                Log::warning('IEEE request failed', ['status' => $response->status()]);
                SystemLogger::warning('IEEE Xplore request failed', ['status' => $response->status(), 'query' => $query]);
                return [];
            }

            $articles = $response->json('articles', []);

            return collect($articles)->map(function ($item) {
                return [
                    'title' => $item['title'] ?? 'Untitled',
                    'authors' => collect($item['authors']['authors'] ?? [])->pluck('full_name')->implode(', '),
                    'year' => $item['publication_year'] ?? null,
                    'abstract' => $item['abstract'] ?? null,
                    'url' => $item['html_url'] ?? $item['pdf_url'] ?? null,
                    'citationCount' => $item['citing_paper_count'] ?? 0,
                    'venue' => $item['publication_title'] ?? null,
                    'source' => 'IEEE Xplore',
                ];
            })->filter(fn ($p) => !empty($p['url']))->values()->all();
        } catch (\Throwable $e) {
            Log::error('IeeeService error: ' . $e->getMessage());
            SystemLogger::error('IEEE Xplore service exception', ['message' => $e->getMessage(), 'query' => $query]);
            return [];
        }
    }
}
