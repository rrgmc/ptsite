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
 * "Abrir": opens a scheduled night. Only one night per season can be open at a time.
 */
final class OpenNight
{
    public function __construct(
        private readonly NightRules $rules,
        private readonly AuditLogger $audit,
    ) {}

    public function __invoke(User $user, Night $night): Night
    {
        Gate::forUser($user)->authorize('open', $night);

        return DB::transaction(function () use ($user, $night) {
            $anotherOpen = Night::query()->notArchived()
                ->where('season_id', $night->season_id)
                ->where('status', NightStatus::Open->value)
                ->whereKeyNot($night->id)
                ->lockForUpdate()
                ->exists();
            $this->rules->assertCanOpen(NightStatus::from($night->status), $anotherOpen);

            $before = NightSnapshot::of($night);
            $night->forceFill(['status' => NightStatus::Open->value])->save();
            $this->audit->record($user, 'night.opened', $night, $before, NightSnapshot::of($night));

            return $night;
        });
    }
}
