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
 * "Definir manualmente": types the pot and the time chip of an open night, for a night that does not record
 * every player's payments. They are kept in the partial result and stand in for the amounts the dashboard works
 * out, which it still shows. Null takes a typed amount away.
 */
final class SetPartialAmounts
{
    public function __construct(
        private readonly NightEntries $entries,
        private readonly NightDashboardRules $rules,
        private readonly Features $features,
    ) {}

    /** @param  ?string  $pot, $timeChip  decimal strings, or null for the amount the dashboard works out */
    public function __invoke(User $user, Night $night, ?string $pot, ?string $timeChip): Night
    {
        return $this->entries->change($user, $night, null, function (Night $night) use ($user, $pot, $timeChip) {
            $this->rules->assertTakesPartialResult(NightStatus::from($night->status));

            NightPartialResult::query()->updateOrCreate(['night_id' => $night->id], [
                'pot' => $pot,
                // An amount of a feature this site has turned off is not kept, whatever was sent.
                'time_chip' => $this->features->enabled(Feature::TimeChip) ? $timeChip : null,
                'saved_by_user_id' => $user->id,
                'saved_at' => now(),
            ]);
        });
    }
}
