<?php

namespace Database\Seeders;

use App\Models\Source;
use Illuminate\Database\Seeder;

class SourceSeeder extends Seeder
{
    public function run(): void
    {
        $sources = [
            [
                'key' => 'semantic_scholar',
                'name' => 'Semantic Scholar',
                'description' => 'Free academic search engine, no API key required.',
                'requires_api_key' => false,
                'api_key_env' => null,
                'priority_weight' => 20,
                'is_active' => true,
            ],
            [
                'key' => 'crossref',
                'name' => 'CrossRef',
                'description' => 'Free DOI/metadata search for scholarly works, no API key required.',
                'requires_api_key' => false,
                'api_key_env' => null,
                'priority_weight' => 15,
                'is_active' => true,
            ],
            [
                'key' => 'arxiv',
                'name' => 'arXiv',
                'description' => 'Free preprint repository, no API key required.',
                'requires_api_key' => false,
                'api_key_env' => null,
                'priority_weight' => 10,
                'is_active' => true,
            ],
            [
                'key' => 'ieee',
                'name' => 'IEEE Xplore',
                'description' => 'Requires a free API key from developer.ieee.org',
                'requires_api_key' => true,
                'api_key_env' => 'IEEE_API_KEY',
                'priority_weight' => 25,
                'is_active' => true,
            ],
            [
                'key' => 'google_scholar',
                'name' => 'Google Scholar',
                'description' => 'Accessed via SerpApi proxy since Google has no official Scholar API. Requires a SerpApi key.',
                'requires_api_key' => true,
                'api_key_env' => 'SERPAPI_KEY',
                'priority_weight' => 20,
                'is_active' => true,
            ],
        ];

        foreach ($sources as $source) {
            Source::updateOrCreate(['key' => $source['key']], $source);
        }
    }
}
