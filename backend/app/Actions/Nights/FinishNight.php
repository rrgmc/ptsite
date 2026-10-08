<?php

namespace PTSite\App\Actions\Nights;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use PTSite\App\Actions\Nights\Dashboard\FixNightMoney;
use PTSite\App\Models\Night;
use PTSite\App\Models\User;
use PTSite\App\Support\AuditLogger;
use PTSite\Domain\Features\Feature;
use PTSite\Domain\Features\Features;
use PTSite\Domain\Nights\NightRules;
use PTSite\Domain\Nights\NightStatus;
use PTSite\Domain\Nights\NightType;

/**
 * "Finalizar": enters the results of an open night, or corrects the results of a finished one. A Main Event
 * night is finished by FinishMainEventNight.
 */
final class FinishNight
{
    public function __construct(
        private readonly NightRules $rules,
        private readonly WriteNightResult $writeResult,
        private readonly AuditLogger $audit,
        private readonly Features $features,
        private readonly FixNightMoney $fixMoney,
    ) {}

    /** @param array<int, int> $playerByPosition position => player id */
    public function __invoke(User $user, Night $night, string $pot, ?string $mainEventPot, ?string $timeChip, array $playerByPosition): Night
    {
        Gate::forUser($user)->authorize('finish', $night);
        $this->rules->assertTakesPoints(NightType::from($night->type));
        $wasFinished = $night->status === NightStatus::Finished->value;
        $this->rules->assertCanFinish(NightStatus::from($night->status));

        return DB::transaction(function () use ($user, $night, $pot, $mainEventPot, $timeChip, $playerByPosition, $wasFinished) {
            $before = NightSnapshot::of($night);
            ($this->writeResult)($night, $pot, $mainEventPot, $timeChip, $playerByPosition);
            // The official result replaces the partial one.
            $night->partialResult()->delete();
            if (! $wasFinished && $this->features->enabled(Feature::NightDashboard)) {
                ($this->fixMoney)($night);
            }
            $this->audit->record($user, $wasFinished ? 'night.corrected' : 'night.finished', $night, $before, NightSnapshot::of($night));

            return $night;
        });
    }
}
