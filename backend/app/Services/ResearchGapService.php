<?php

namespace App\Services;

class ResearchGapService
{
    public function __construct(protected AiClientService $ai) {}

    public function isAvailable(): bool
    {
        return $this->ai->isConfigured();
    }

    /**
     * @param string $topic  The user's original search prompt / research topic.
     * @param array  $papers Array of ['title' => ..., 'abstract' => ..., 'year' => ..., 'authors' => ...]
     *
     * @return array{overview: string, gaps: array}
     */
    public function analyze(string $topic, array $papers): array
    {
        // Cap how many papers we send: keeps the prompt small/cheap and
        // avoids hitting context limits on the cheaper models.
        $papers = array_slice($papers, 0, 15);

        $systemPrompt = <<<'PROMPT'
You are a research assistant helping a student or researcher find gaps in a
body of literature. You will be given a research topic and a list of papers
(title, year, abstract) that were already found on that topic.

Identify genuine, specific research gaps — things that are under-explored,
contradictory, methodologically weak, or missing entirely from this set of
papers. Do not just summarize the papers.

Respond with ONLY valid JSON (no markdown fences, no commentary) in exactly
this shape:

{
  "overview": "2-3 sentence plain-language summary of where this research area currently stands based on the papers given",
  "gaps": [
    {
      "gap": "short title of the gap",
      "why_it_matters": "1-2 sentences explaining why this gap matters",
      "suggested_direction": "1-2 sentences suggesting a concrete research direction to address it"
    }
  ]
}

Return between 3 and 6 gaps. Be specific to the actual papers provided, not generic.
PROMPT;

        $paperLines = [];
        foreach ($papers as $i => $paper) {
            $n = $i + 1;
            $title = $paper['title'] ?? 'Untitled';
            $year = $paper['year'] ?? 'n.d.';
            $abstract = mb_substr((string) ($paper['abstract'] ?? ''), 0, 600);
            $paperLines[] = "{$n}. \"{$title}\" ({$year})\n   Abstract: {$abstract}";
        }

        $userPrompt = "Research topic: \"{$topic}\"\n\nPapers found so far:\n\n" . implode("\n\n", $paperLines);

        $raw = $this->ai->chat($systemPrompt, $userPrompt);

        return $this->parseResponse($raw);
    }

    protected function parseResponse(string $raw): array
    {
        $cleaned = trim($raw);
        // Strip accidental markdown code fences if the model adds them anyway.
        $cleaned = preg_replace('/^```(json)?/i', '', $cleaned);
        $cleaned = preg_replace('/```$/', '', $cleaned);
        $cleaned = trim($cleaned);

        $decoded = json_decode($cleaned, true);

        if (!is_array($decoded) || !isset($decoded['gaps']) || !is_array($decoded['gaps'])) {
            throw new \RuntimeException('AI response was not in the expected format. Please try again.');
        }

        $gaps = array_map(function ($gap) {
            return [
                'gap' => $gap['gap'] ?? 'Untitled gap',
                'why_it_matters' => $gap['why_it_matters'] ?? '',
                'suggested_direction' => $gap['suggested_direction'] ?? '',
            ];
        }, $decoded['gaps']);

        return [
            'overview' => $decoded['overview'] ?? '',
            'gaps' => $gaps,
        ];
    }
}
