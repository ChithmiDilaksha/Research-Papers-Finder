<?php

namespace App\Http\Controllers;

use App\Models\Source;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;

class SourceController extends Controller
{
    /**
     * List sources available to search. Any logged-in user can see this
     * (used to populate the "Sources to search" checkboxes on the form).
     * Only active sources are returned here.
     */
    public function index(Request $request)
    {
        $query = Source::query();

        // Admins hitting /api/admin/sources see everything including inactive ones.
        if (!$request->routeIs('admin.*')) {
            $query->where('is_active', true);
        }

        return response()->json(
            $query->orderByDesc('priority_weight')->get()
        );
    }

    /**
     * Admin only: create a new master source.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'key' => 'required|string|max:50|unique:sources,key|alpha_dash',
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:500',
            'requires_api_key' => 'boolean',
            'api_key_env' => 'nullable|string|max:100',
            'priority_weight' => 'integer|min:0|max:100',
            'is_active' => 'boolean',
        ]);

        $source = Source::create($validated);

        ActivityLogger::log($request->user()->id, 'source_created', "Source master created: {$source->name} ({$source->key})");

        return response()->json($source, 201);
    }

    /**
     * Admin only: update an existing master source
     * (rename, toggle active, change priority weight, etc).
     */
    public function update(Request $request, Source $source)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:100',
            'description' => 'nullable|string|max:500',
            'requires_api_key' => 'boolean',
            'api_key_env' => 'nullable|string|max:100',
            'priority_weight' => 'integer|min:0|max:100',
            'is_active' => 'boolean',
        ]);

        $source->update($validated);

        ActivityLogger::log($request->user()->id, 'source_updated', "Source master updated: {$source->name} ({$source->key})");

        return response()->json($source);
    }

    /**
     * Admin only: remove a master source (it will no longer be searchable).
     */
    public function destroy(Request $request, Source $source)
    {
        $name = $source->name;
        $key = $source->key;
        $source->delete();

        ActivityLogger::log($request->user()->id, 'source_deleted', "Source master deleted: {$name} ({$key})");

        return response()->json(['message' => 'Source deleted']);
    }
}
