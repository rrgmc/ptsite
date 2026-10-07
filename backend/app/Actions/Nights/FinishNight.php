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
 * "Finalizar": enters the results of an open night, or corrects the results of a finished one.
 */
final class FinishNight
{
    public function __construct(
        private readonly NightRules $rules,
        private readonly WriteNightResult $writeResult,
        private readonly AuditLogger $audit,
    ) {}

    /** @param array<int, int> $playerByPosition position => player id */
    public function __invoke(User $user, Night $night, string $pot, string $mainEventPot, string $timeChip, array $playerByPosition): Night
    {
        Gate::forUser($user)->authorize('finish', $night);
        $wasFinished = $night->status === NightStatus::Finished->value;
        $this->rules->assertCanFinish(NightStatus::from($night->status));

        return DB::transaction(function () use ($user, $night, $pot, $mainEventPot, $timeChip, $playerByPosition, $wasFinished) {
            $before = NightSnapshot::of($night);
            ($this->writeResult)($night, $pot, $mainEventPot, $timeChip, $playerByPosition);
            // The official result replaces the partial one.
            $night->partialResult()->delete();
            $this->audit->record($user, $wasFinished ? 'night.corrected' : 'night.finished', $night, $before, NightSnapshot::of($night));

            return $night;
        });
    }
}
