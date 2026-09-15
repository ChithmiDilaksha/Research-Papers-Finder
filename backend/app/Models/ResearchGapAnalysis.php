<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ResearchGapAnalysis extends Model
{
    protected $fillable = [
        'user_id',
        'search_history_id',
        'topic',
        'papers_analyzed',
        'gaps',
        'overview',
        'ai_provider',
        'ai_model',
    ];

    protected function casts(): array
    {
        return [
            'gaps' => 'array',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function searchHistory()
    {
        return $this->belongsTo(SearchHistory::class);
    }
}
