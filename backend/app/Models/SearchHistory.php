<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SearchHistory extends Model
{
    protected $fillable = [
        'user_id',
        'prompt',
        'limit_requested',
        'sources_used',
        'results',
        'found_count',
    ];

    protected function casts(): array
    {
        return [
            'sources_used' => 'array',
            'results' => 'array',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
