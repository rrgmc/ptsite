<?php

namespace PTSite\App\Support;

use Illuminate\Support\Collection;
use PTSite\App\Models\Night;
use PTSite\App\Models\NightRebuy;
use PTSite\Domain\Attendance\AttendanceAnswer;
use PTSite\Domain\Features\Feature;
use PTSite\Domain\Features\Features;
use PTSite\Domain\Nights\NightEntry;
use PTSite\Domain\Nights\NightPrices;
use PTSite\Domain\Nights\NightStatus;
use PTSite\Domain\Seasons\SeasonMoney;
use PTSite\Domain\Shared\Money;

/**
 * Reads what the night dashboard recorded for a night as domain objects: its prices and its participants
 * (docs/specs/night-dashboard.md).
 */
final class NightLedger
{
    public function __construct(private readonly Features $features) {}

    /** The prices the night charges: the ones it was finished with, or else its season's. */
    public function prices(Night $night): NightPrices
    {
        $source = $night->prices ?? $night->season;
        $money = fn (string $key) => $source->getAttribute($key) === null ? null : Money::fromDecimal((string) $source->getAttribute($key));

        return NightPrices::of(SeasonMoney::of(
            buyIn: $money('buy_in'),
            rebuyValue: $money('rebuy_value') ?? Money::zero(),
            timeChipValue: $money('time_chip_value'),
            rebuysAllowed: (int) $source->rebuys_allowed,
            rebuyChargesTimeChip: (bool) $source->rebuy_charges_time_chip,
            allowsExtraRebuys: (bool) $source->allows_extra_rebuys,
            // As SaveSeason does: a value stored before the feature was turned off is left out.
            houseOwnerBuyIn: $this->features->enabled(Feature::HouseOwnerBuyIn) && $money('buy_in') !== null ? $money('house_owner_buy_in') : null,
            mainEventPotPercent: $night->season->main_event_pot_percent,
        ), $this->features);
    }

    /**
     * A night's rebuys, oldest first, by player.
     *
     * @return Collection<int, Collection<int, NightRebuy>>
     */
    public function rebuysByPlayer(Night $night): Collection
    {
        return $night->rebuys()->get()->groupBy('player_id');
    }

    /**
     * The participants: the players with a record and, while the night is open, the ones who answered ALL IN.
     *
     * @param  Collection<int, Collection<int, NightRebuy>>|null  $rebuysByPlayer  when already read
     * @return array<int, NightEntry> by player id
     */
    public function entries(Night $night, ?Collection $rebuysByPlayer = null): array
    {
        $rebuysByPlayer ??= $this->rebuysByPlayer($night);
        $rebuysPaid = fn (int $playerId) => ($rebuysByPlayer[$playerId] ?? collect())->map(fn (NightRebuy $r) => $r->paid_at !== null)->values()->all();
        $timeChip = $this->features->enabled(Feature::TimeChip);

        $entries = [];
        foreach ($night->entries()->get() as $row) {
            $entries[$row->player_id] = new NightEntry(
                $row->player_id,
                $row->player_id === $night->house_owner_player_id,
                $row->buy_in_paid_at !== null,
                $timeChip && $row->time_chip_at !== null,
                $timeChip && $row->time_chip_paid_at !== null,
                $rebuysPaid($row->player_id),
            );
        }
        if ($night->status === NightStatus::Open->value) {
            $coming = $night->attendances()->where('answer', AttendanceAnswer::AllIn->value)->pluck('player_id');
            foreach ($coming as $playerId) {
                $entries[$playerId] ??= new NightEntry($playerId, $playerId === $night->house_owner_player_id);
            }
        }

        return $entries;
    }
}
