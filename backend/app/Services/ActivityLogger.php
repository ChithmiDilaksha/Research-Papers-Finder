<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Support\Facades\Request as RequestFacade;

class ActivityLogger
{
    /**
     * Record a user activity, e.g. login, logout, register, search,
     * source_created, source_updated, source_deleted.
     */
    public static function log(?int $userId, string $action, ?string $description = null): void
    {
        ActivityLog::create([
            'user_id' => $userId,
            'action' => $action,
            'description' => $description,
            'ip_address' => RequestFacade::ip(),
        ]);
    }
}
