<?php

/**
 * Add these entries inside the array returned by config/services.php
 * (Laravel's default services.php already exists in a fresh install —
 * merge these keys into it, don't replace the whole file).
 */

return [

    'ieee' => [
        'key' => env('IEEE_API_KEY'),
    ],

    'serpapi' => [
        'key' => env('SERPAPI_KEY'),
    ],

];
