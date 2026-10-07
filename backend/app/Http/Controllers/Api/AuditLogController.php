<?php

namespace PTSite\App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use PTSite\App\Http\Controllers\Controller;
use PTSite\App\Http\Resources\AuditLogResource;
use PTSite\App\Models\AuditLog;

class AuditLogController extends Controller
{
    /** Admin changes, newest first. Filter with subject_type (Night, Player, Season, Place) and subject_id. Admins. */
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', AuditLog::class);

        return AuditLogResource::collection(AuditLog::query()
            ->when($request->query('subject_type'), fn ($q, $type) => $q->where('subject_type', $type))
            ->when($request->query('subject_id'), fn ($q, $id) => $q->where('subject_id', $id))
            ->with('user')
            ->latest('id')
            ->paginate(50));
    }
}
