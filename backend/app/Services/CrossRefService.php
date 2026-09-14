<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CrossRefService
{
    protected string $baseUrl = 'https://api.crossref.org/works';

    /**
     * Search papers via CrossRef (free, no API key required).
     * Docs: https://api.crossref.org/swagger-ui/index.html
     */
    public function search(string $query, int $limit = 10): array
    {
        try {
            $response = Http::timeout(15)->get($this->baseUrl, [
                'query' => $query,
                'rows' => min($limit, 50),
                'sort' => 'relevance',
            ]);

            if (!$response->successful()) {
                Log::warning('CrossRef request failed', ['status' => $response->status()]);
                return [];
            }

            $items = $response->json('message.items', []);

            return collect($items)->map(function ($item) {
                $authors = collect($item['author'] ?? [])->map(function ($a) {
                    return trim(($a['given'] ?? '') . ' ' . ($a['family'] ?? ''));
                })->implode(', ');

                return [
                    'title' => $item['title'][0] ?? 'Untitled',
                    'authors' => $authors,
                    'year' => $item['published']['date-parts'][0][0] ?? null,
                    'abstract' => isset($item['abstract']) ? strip_tags($item['abstract']) : null,
                    'url' => $item['URL'] ?? null,
                    'citationCount' => $item['is-referenced-by-count'] ?? 0,
                    'venue' => $item['container-title'][0] ?? null,
                    'source' => 'CrossRef',
                ];
            })->filter(fn ($p) => !empty($p['url']))->values()->all();
        } catch (\Throwable $e) {
            Log::error('CrossRefService error: ' . $e->getMessage());
            return [];
        }
    }
}
