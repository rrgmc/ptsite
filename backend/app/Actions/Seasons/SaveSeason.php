<?php

namespace PTSite\App\Actions\Seasons;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use PTSite\App\Models\Season;
use PTSite\App\Models\User;
use PTSite\App\Support\AuditLogger;
use PTSite\Domain\Features\Feature;
use PTSite\Domain\Features\Features;
use PTSite\Domain\Nights\SchedulePattern;
use PTSite\Domain\Scoring\PercentageTable;
use PTSite\Domain\Seasons\SeasonMoney;
use PTSite\Domain\Shared\Money;

/**
 * Creates or updates a season and its percentage table (admins). The table must add up to 100%, and the money
 * settings are checked as a whole (SeasonMoney).
 */
final class SaveSeason
{
    public function __construct(private readonly AuditLogger $audit, private readonly Features $features) {}

    /**
     * @param array{name?: string, starts_on?: string, default_place_id?: ?int, description?: ?string,
     *              buy_in?: ?string, rebuy_value?: ?string, time_chip_value?: ?string, rebuys_allowed?: int,
     *              rebuy_charges_time_chip?: bool, allows_extra_rebuys?: bool, house_owner_buy_in?: ?string, is_open?: bool, is_finished?: bool, schedule_weekday?: int, schedule_time?: string,
     *              schedule_every_weeks?: int, rounds?: int, percentages?: array<int, int>} $data
     */
    public function __invoke(User $user, ?Season $season, array $data): Season
    {
        $season === null
            ? Gate::forUser($user)->authorize('create', Season::class)
            : Gate::forUser($user)->authorize('update', $season);

        $table = isset($data['percentages']) ? PercentageTable::of($data['percentages']) : null;
        // Check the regular night as a whole, with unchanged parts taken from the season.
        $standard = SchedulePattern::standard();
        SchedulePattern::of(
            (int) ($data['schedule_weekday'] ?? $season?->schedule_weekday ?? $standard->weekday),
            (string) ($data['schedule_time'] ?? $season?->schedule_time ?? $standard->time),
            (int) ($data['schedule_every_weeks'] ?? $season?->schedule_every_weeks ?? $standard->everyWeeks),
        );
        $this->assertValidMoney($season, $data);
        if ($season === null && $table === null) {
            $table = PercentageTable::standard();
        }

        return DB::transaction(function () use ($user, $season, $data, $table) {
            if ($season === null) {
                // A new season starts with the latest season's regular night and rounds unless given.
                $latest = Season::query()->notArchived()->latest('starts_on')->first();
                $season = new Season(['is_open' => true, 'is_finished' => false, 'rebuys_allowed' => 0, 'rebuy_charges_time_chip' => false, 'allows_extra_rebuys' => false]);
                if ($latest !== null) {
                    $season->fill($latest->only(['schedule_weekday', 'schedule_time', 'schedule_every_weeks', 'rounds']));
                }
            }
            $before = $season->exists ? $this->snapshot($season) : null;

            $season->fill(array_intersect_key($data, array_flip(['name', 'starts_on', 'default_place_id', 'description', 'buy_in', 'rebuy_value', 'time_chip_value', 'rebuys_allowed', 'rebuy_charges_time_chip', 'allows_extra_rebuys', 'house_owner_buy_in', 'is_open', 'is_finished', 'schedule_weekday', 'schedule_time', 'schedule_every_weeks', 'rounds'])));
            $season->save();

            if ($table !== null) {
                $season->percentages()->delete();
                foreach ($table->percentByPosition as $position => $percent) {
                    $season->percentages()->create(['position' => $position, 'percent' => $percent]);
                }
                $season->unsetRelation('percentages');
            }

            $this->audit->record($user, $before === null ? 'season.created' : 'season.updated', $season, $before, $this->snapshot($season));

            return $season;
        });
    }

    /**
     * Checks the money settings as a whole, with unchanged parts taken from the season. A stored house owner's
     * buy-in is left out on a site that turned the feature off, so it cannot block a change to the buy-in.
     *
     * @param  array<string, mixed>  $data
     */
    private function assertValidMoney(?Season $season, array $data): void
    {
        $value = fn (string $key) => array_key_exists($key, $data) ? $data[$key] : $season?->getAttribute($key);
        $money = fn (string $key) => $value($key) === null ? null : Money::fromDecimal((string) $value($key));

        SeasonMoney::of(
            buyIn: $money('buy_in'),
            rebuyValue: $money('rebuy_value'),
            timeChipValue: $money('time_chip_value'),
            rebuysAllowed: (int) $value('rebuys_allowed'),
            rebuyChargesTimeChip: (bool) $value('rebuy_charges_time_chip'),
            allowsExtraRebuys: (bool) $value('allows_extra_rebuys'),
            houseOwnerBuyIn: $this->features->enabled(Feature::HouseOwnerBuyIn) ? $money('house_owner_buy_in') : null,
        );
    }

    /** @return array<string, mixed> */
    private function snapshot(Season $season): array
    {
        return [
            'name' => $season->name,
            'starts_on' => $season->starts_on?->toDateString(),
            'default_place_id' => $season->default_place_id,
            'buy_in' => $season->buy_in,
            'rebuy_value' => $season->rebuy_value,
            'time_chip_value' => $season->time_chip_value,
            'rebuys_allowed' => $season->rebuys_allowed,
            'rebuy_charges_time_chip' => $season->rebuy_charges_time_chip,
            'allows_extra_rebuys' => $season->allows_extra_rebuys,
            'house_owner_buy_in' => $season->house_owner_buy_in,
            'rounds' => $season->rounds,
            'is_open' => $season->is_open,
            'is_finished' => $season->is_finished,
            'schedule' => [$season->schedule_weekday, $season->schedule_time, $season->schedule_every_weeks],
            'percentages' => $season->percentByPosition(),
        ];
    }
}
