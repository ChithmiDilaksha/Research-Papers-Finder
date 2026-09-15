<?php

namespace App\Services;

use App\Models\SystemLog;

class SystemLogger
{
    /**
     * Record a system-level event, e.g. an external API (IEEE, CrossRef...)
     * failing, timing out, or returning an unexpected response.
     */
    public static function log(string $level, string $message, array $context = []): void
    {
        SystemLog::create([
            'level' => $level, // info | warning | error
            'message' => $message,
            'context' => $context,
        ]);
    }

    public static function info(string $message, array $context = []): void
    {
        self::log('info', $message, $context);
    }

    public static function warning(string $message, array $context = []): void
    {
        self::log('warning', $message, $context);
    }

    public static function error(string $message, array $context = []): void
    {
        self::log('error', $message, $context);
    }
}
