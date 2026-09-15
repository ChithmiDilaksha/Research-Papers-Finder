<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

/**
 * Thin, provider-agnostic wrapper around whichever LLM API key the project
 * owner configures. Supports OpenAI, Anthropic (Claude), and Google Gemini
 * behind one simple chat() call so feature code never has to care which
 * provider is active.
 *
 * Configure via .env:
 *   AI_PROVIDER=openai|anthropic|gemini
 *   AI_API_KEY=...
 *   AI_MODEL=...   (optional, sensible default per provider is used otherwise)
 */
class AiClientService
{
    protected string $provider;
    protected ?string $apiKey;
    protected string $model;

    public function __construct()
    {
        $this->provider = strtolower(config('services.ai.provider', 'openai'));
        $this->apiKey = config('services.ai.key');
        $this->model = config('services.ai.model') ?: $this->defaultModel();
    }

    public function isConfigured(): bool
    {
        return !empty($this->apiKey);
    }

    public function providerName(): string
    {
        return $this->provider;
    }

    public function modelName(): string
    {
        return $this->model;
    }

    protected function defaultModel(): string
    {
        return match ($this->provider) {
            'anthropic' => 'claude-sonnet-4-6',
            'gemini' => 'gemini-3.6-flash',
            default => 'gpt-4.1-mini',
        };
    }

    /**
     * Send a system + user prompt, get back the raw text reply.
     * Throws \RuntimeException on any failure (missing key, HTTP error, etc.)
     * so callers can decide how to surface it.
     */
    public function chat(string $systemPrompt, string $userPrompt): string
    {
        if (!$this->isConfigured()) {
            throw new \RuntimeException(
                'No AI API key configured. Set AI_PROVIDER and AI_API_KEY in backend/.env to enable AI-powered features.'
            );
        }

        return match ($this->provider) {
            'anthropic' => $this->callAnthropic($systemPrompt, $userPrompt),
            'gemini' => $this->callGemini($systemPrompt, $userPrompt),
            default => $this->callOpenAi($systemPrompt, $userPrompt),
        };
    }

    protected function callOpenAi(string $systemPrompt, string $userPrompt): string
    {
        $response = Http::withToken($this->apiKey)
            ->timeout(60)
            ->post('https://api.openai.com/v1/chat/completions', [
                'model' => $this->model,
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $userPrompt],
                ],
                'temperature' => 0.4,
            ]);

        if (!$response->successful()) {
            throw new \RuntimeException('OpenAI request failed: ' . $response->body());
        }

        return $response->json('choices.0.message.content') ?? '';
    }

    protected function callAnthropic(string $systemPrompt, string $userPrompt): string
    {
        $response = Http::withHeaders([
                'x-api-key' => $this->apiKey,
                'anthropic-version' => '2023-06-01',
            ])
            ->timeout(60)
            ->post('https://api.anthropic.com/v1/messages', [
                'model' => $this->model,
                'max_tokens' => 2000,
                'system' => $systemPrompt,
                'messages' => [
                    ['role' => 'user', 'content' => $userPrompt],
                ],
            ]);

        if (!$response->successful()) {
            throw new \RuntimeException('Anthropic request failed: ' . $response->body());
        }

        return $response->json('content.0.text') ?? '';
    }

    protected function callGemini(string $systemPrompt, string $userPrompt): string
    {
        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$this->model}:generateContent?key={$this->apiKey}";

        $response = Http::timeout(60)->post($url, [
            'systemInstruction' => [
                'parts' => [['text' => $systemPrompt]],
            ],
            'contents' => [
                ['role' => 'user', 'parts' => [['text' => $userPrompt]]],
            ],
            'generationConfig' => ['temperature' => 0.4],
        ]);

        if (!$response->successful()) {
            throw new \RuntimeException('Gemini request failed: ' . $response->body());
        }

        return $response->json('candidates.0.content.parts.0.text') ?? '';
    }
}
