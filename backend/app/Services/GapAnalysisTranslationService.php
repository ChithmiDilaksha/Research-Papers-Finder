<?php

namespace App\Services;

use App\Models\ResearchGapAnalysis;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class GapAnalysisTranslationService
{
    public function __construct(private AiClientService $ai)
    {
    }

    private const LANGUAGE_NAMES = [
        'si' => 'Sinhala', 'ta' => 'Tamil', 'hi' => 'Hindi', 'es' => 'Spanish',
        'fr' => 'French', 'de' => 'German', 'zh' => 'Chinese', 'ja' => 'Japanese',
        'ar' => 'Arabic',
    ];

    public function translate(ResearchGapAnalysis $gapAnalysis, string $langCode): array
    {
        $languageName = self::LANGUAGE_NAMES[$langCode]
            ?? throw new RuntimeException("Unsupported language code: {$langCode}");

        $payload = [
            'topic' => $gapAnalysis->topic,
            'overview' => $gapAnalysis->overview,
            'gaps' => $gapAnalysis->gaps, // array of {gap, why_it_matters, suggested_direction}
        ];

        $prompt = <<<PROMPT
        Translate the following JSON object's string values into {$languageName}.
        Keep the exact same JSON structure and keys. Do not translate proper nouns,
        citations, or paper titles if present. Return ONLY valid JSON, no markdown
        fences, no commentary.

        {$this->toJson($payload)}
        PROMPT;

        $translatedJson = $this->ai->chat(
            'You translate research gap analyses and return only valid JSON.',
            $prompt
        );

        $translatedJson = preg_replace('/^```(?:json)?\s*|\s*```$/i', '', trim($translatedJson));

        $decoded = json_decode($translatedJson, true);
        if (!is_array($decoded) || !isset($decoded['gaps'])) {
            Log::warning('Gap analysis translation returned unexpected shape', [
                'gap_analysis_id' => $gapAnalysis->id,
                'lang' => $langCode,
                'raw' => $translatedJson,
            ]);
            throw new RuntimeException('Translation failed: unexpected response format.');
        }

        return [
            'id' => $gapAnalysis->id,
            'topic' => $decoded['topic'] ?? $gapAnalysis->topic,
            'overview' => $decoded['overview'] ?? $gapAnalysis->overview,
            'papers_analyzed' => $gapAnalysis->papers_analyzed,
            'ai_provider' => $gapAnalysis->ai_provider,
            'gaps' => $decoded['gaps'],
        ];
    }

    private function toJson(array $payload): string
    {
        return json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    }

}