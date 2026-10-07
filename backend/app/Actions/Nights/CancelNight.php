<?php

namespace PTSite\App\Actions\Nights;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use PTSite\App\Models\Night;
use PTSite\App\Models\User;
use PTSite\App\Support\AuditLogger;
use PTSite\Domain\Nights\NightRules;
use PTSite\Domain\Nights\NightStatus;

/**
 * "Cancelar": cancels a scheduled night. It is archived, not deleted: it leaves the season's lists and calendar,
 * frees its date and stays in the audit log.
 */
final class CancelNight
{
    public function __construct(
        private readonly NightRules $rules,
        private readonly AuditLogger $audit,
    ) {}

    public function __invoke(User $user, Night $night): Night
    {
        Gate::forUser($user)->authorize('cancel', $night);
        $this->rules->assertCanCancel(NightStatus::from($night->status));

        return DB::transaction(function () use ($user, $night) {
            $before = NightSnapshot::of($night);
            $night->forceFill(['archived_at' => now()])->save();
            $this->audit->record($user, 'night.cancelled', $night, $before, NightSnapshot::of($night));

            return $night;
        });
    }
}
