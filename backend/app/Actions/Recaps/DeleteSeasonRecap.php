<?php

namespace PTSite\App\Actions\Recaps;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use PTSite\App\Models\SeasonRecap;
use PTSite\App\Models\User;
use PTSite\App\Support\AuditLogger;

/** Deletes a season recap (writers and admins). The audit log keeps its text. */
final class DeleteSeasonRecap
{
    public function __construct(private readonly AuditLogger $audit) {}

    public function __invoke(User $user, SeasonRecap $recap): void
    {
        Gate::forUser($user)->authorize('delete', $recap);

        DB::transaction(function () use ($user, $recap) {
            $this->audit->record($user, 'recap.deleted', $recap, [
                'night_id' => $recap->night_id,
                'body' => $recap->body,
                'published' => $recap->published_at !== null,
            ], null);
            $recap->delete();
        });
    }
}
