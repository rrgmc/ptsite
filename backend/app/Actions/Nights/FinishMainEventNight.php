<?php

namespace PTSite\App\Actions\Nights;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use PTSite\App\Models\Night;
use PTSite\App\Models\User;
use PTSite\App\Support\AuditLogger;
use PTSite\Domain\Nights\NightRules;
use PTSite\Domain\Nights\NightStatus;
use PTSite\Domain\Nights\NightType;

/**
 * "Finalizar" for a Main Event night: enters the order of its players, or corrects it on a finished one.
 */
final class FinishMainEventNight
{
    public function __construct(
        private readonly NightRules $rules,
        private readonly WriteMainEventResult $writeResult,
        private readonly AuditLogger $audit,
    ) {}

    /** @param list<int> $playerIds the 1st place first */
    public function __invoke(User $user, Night $night, array $playerIds): Night
    {
        Gate::forUser($user)->authorize('finish', $night);
        $this->rules->assertTakesMainEventOrder(NightType::from($night->type));
        $wasFinished = $night->status === NightStatus::Finished->value;
        $this->rules->assertCanFinish(NightStatus::from($night->status));

        return DB::transaction(function () use ($user, $night, $playerIds, $wasFinished) {
            $before = NightSnapshot::of($night);
            ($this->writeResult)($night, $playerIds);
            $this->audit->record($user, $wasFinished ? 'night.corrected' : 'night.finished', $night, $before, NightSnapshot::of($night));

            return $night;
        });
    }
}
