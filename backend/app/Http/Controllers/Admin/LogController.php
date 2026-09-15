<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\SystemLog;
use Illuminate\Http\Request;

class LogController extends Controller
{
    /**
     * Admin only: paginated list of user activity (logins, searches,
     * source master changes, etc), newest first. Optional filters:
     * ?user_id=  ?action=
     */
    public function activity(Request $request)
    {
        $query = ActivityLog::with('user:id,name,email')->latest();

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->integer('user_id'));
        }
        if ($request->filled('action')) {
            $query->where('action', $request->string('action'));
        }

        return response()->json($query->paginate(25));
    }

    /**
     * Admin only: paginated list of system-level log entries
     * (e.g. external research API failures), newest first.
     * Optional filter: ?level=warning|error|info
     */
    public function system(Request $request)
    {
        $query = SystemLog::latest();

        if ($request->filled('level')) {
            $query->where('level', $request->string('level'));
        }

        return response()->json($query->paginate(25));
    }
}
