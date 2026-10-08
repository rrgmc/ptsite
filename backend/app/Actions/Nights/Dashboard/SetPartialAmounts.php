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
 * "Manual": types the pot or the time chip of an open night, for a night that does not record every player's
 * payments. They are kept in the partial result and stand in for the amounts the dashboard works out, which it
 * still shows. Null takes a typed amount away. Each amount is set by itself.
 */
final class SetPartialAmounts
{
    public function __construct(
        private readonly NightEntries $entries,
        private readonly NightDashboardRules $rules,
        private readonly Features $features,
    ) {}

    /**
     * @param  array{pot?: ?string, time_chip?: ?string}  $amounts  only the ones to change: a decimal string, or
     *                                                              null for the amount the dashboard works out
     */
    public function __invoke(User $user, Night $night, array $amounts): Night
    {
        return $this->entries->change($user, $night, null, function (Night $night) use ($user, $amounts) {
            $this->rules->assertTakesPartialResult(NightStatus::from($night->status));
            $amounts = array_intersect_key($amounts, ['pot' => true, 'time_chip' => true]);
            if (! $this->features->enabled(Feature::TimeChip)) {
                // An amount of a feature this site has turned off is not kept, whatever was sent.
                unset($amounts['time_chip']);
            }

            NightPartialResult::query()->updateOrCreate(['night_id' => $night->id], [...$amounts, 'saved_by_user_id' => $user->id, 'saved_at' => now()]);
        });
    }
}
