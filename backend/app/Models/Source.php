<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Source extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'name',
        'description',
        'requires_api_key',
        'api_key_env',
        'priority_weight',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'requires_api_key' => 'boolean',
            'is_active' => 'boolean',
            'priority_weight' => 'integer',
        ];
    }
}
