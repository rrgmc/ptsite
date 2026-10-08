<?php

namespace PTSite\App\Actions\Nights\Dashboard;

use PTSite\App\Models\Night;
use PTSite\App\Models\NightPartialResult;
use PTSite\App\Models\User;
use PTSite\Domain\Features\Feature;
use PTSite\Domain\Features\Features;
use PTSite\Domain\Nights\NightDashboardRules;
use PTSite\Domain\Nights\NightStatus;

/**
 * "Definir o pote ME manualmente": sets the Main Event pot of an open night by hand, in its partial result. Null
 * goes back to the season's share of the pot. The positions and the other amounts stay as they are.
 */
final class SetPartialMainEventPot
{
    public function __construct(
        private readonly NightEntries $entries,
        private readonly NightDashboardRules $rules,
        private readonly Features $features,
    ) {}

    /** @param  ?string  $amount  a decimal string, or null for the season's share of the pot */
    public function __invoke(User $user, Night $night, ?string $amount): Night
    {
        return $this->entries->change($user, $night, null, function (Night $night) use ($user, $amount) {
            $this->rules->assertTakesPartialResult(NightStatus::from($night->status));

            NightPartialResult::query()->updateOrCreate(['night_id' => $night->id], [
                // An amount of a feature this site has turned off is not kept, whatever was sent.
                'main_event_pot' => $this->features->enabled(Feature::MainEventPot) ? $amount : null,
                'saved_by_user_id' => $user->id,
                'saved_at' => now(),
            ]);
        });
    }
}
