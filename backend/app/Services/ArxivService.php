<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ArxivService
{
    protected string $baseUrl = 'http://export.arxiv.org/api/query';

    /**
     * Search papers via arXiv (free, no API key required).
     * Docs: https://info.arxiv.org/help/api/index.html
     */
    public function search(string $query, int $limit = 10): array
    {
        try {
            $response = Http::timeout(15)->get($this->baseUrl, [
                'search_query' => 'all:' . $query,
                'start' => 0,
                'max_results' => min($limit, 50),
                'sortBy' => 'relevance',
                'sortOrder' => 'descending',
            ]);

            if (!$response->successful()) {
                Log::warning('arXiv request failed', ['status' => $response->status()]);
                return [];
            }

            $xml = simplexml_load_string($response->body());
            if ($xml === false) {
                return [];
            }

            $xml->registerXPathNamespace('atom', 'http://www.w3.org/2005/Atom');
            $entries = $xml->xpath('//atom:entry');

            $results = [];
            foreach ($entries as $entry) {
                $authors = [];
                foreach ($entry->author as $author) {
                    $authors[] = (string) $author->name;
                }

                $link = null;
                foreach ($entry->link as $l) {
                    $attrs = $l->attributes();
                    if ((string) $attrs['type'] === 'text/html' || empty($link)) {
                        $link = (string) $attrs['href'];
                    }
                }

                $published = (string) $entry->published;
                $year = $published ? (int) substr($published, 0, 4) : null;

                $results[] = [
                    'title' => trim(preg_replace('/\s+/', ' ', (string) $entry->title)),
                    'authors' => implode(', ', $authors),
                    'year' => $year,
                    'abstract' => trim(preg_replace('/\s+/', ' ', (string) $entry->summary)),
                    'url' => $link,
                    'citationCount' => 0, // arXiv API does not provide citation counts
                    'venue' => 'arXiv',
                    'source' => 'arXiv',
                ];
            }

            return $results;
        } catch (\Throwable $e) {
            Log::error('ArxivService error: ' . $e->getMessage());
            return [];
        }
    }
}
