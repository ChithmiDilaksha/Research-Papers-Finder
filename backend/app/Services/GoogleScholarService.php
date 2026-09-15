<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Services\SystemLogger;

class GoogleScholarService
{
    protected string $baseUrl = 'https://serpapi.com/search.json';

    /**
     * Search Google Scholar results via SerpApi (Google has no official
     * free/public Scholar API, so a third-party proxy is used).
     * Get a key from https://serpapi.com/ and add SERPAPI_KEY to your .env
     * to enable this source. Without a key this source is skipped.
     */
    public function search(string $query, int $limit = 10): array
    {
        $apiKey = config('services.serpapi.key');

        if (empty($apiKey)) {
            return [];
        }

        try {
            $response = Http::timeout(15)->get($this->baseUrl, [
                'engine' => 'google_scholar',
                'q' => $query,
                'num' => min($limit, 20),
                'api_key' => $apiKey,
            ]);

            if (!$response->successful()) {
                Log::warning('Google Scholar (SerpApi) request failed', ['status' => $response->status()]);
                SystemLogger::warning('Google Scholar (SerpApi) request failed', ['status' => $response->status(), 'query' => $query]);
                return [];
            }

            $results = $response->json('organic_results', []);

            return collect($results)->map(function ($item) {
                $citedBy = $item['inline_links']['cited_by']['total'] ?? 0;

                return [
                    'title' => $item['title'] ?? 'Untitled',
                    'authors' => $item['publication_info']['summary'] ?? null,
                    'year' => $this->extractYear($item['publication_info']['summary'] ?? ''),
                    'abstract' => $item['snippet'] ?? null,
                    'url' => $item['link'] ?? null,
                    'citationCount' => $citedBy,
                    'venue' => null,
                    'source' => 'Google Scholar',
                ];
            })->filter(fn ($p) => !empty($p['url']))->values()->all();
        } catch (\Throwable $e) {
            Log::error('GoogleScholarService error: ' . $e->getMessage());
            SystemLogger::error('Google Scholar service exception', ['message' => $e->getMessage(), 'query' => $query]);
            return [];
        }
    }

    protected function extractYear(string $text): ?int
    {
        if (preg_match('/\b(19|20)\d{2}\b/', $text, $m)) {
            return (int) $m[0];
        }
        return null;
    }
}
