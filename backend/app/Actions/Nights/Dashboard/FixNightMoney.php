<?php

namespace PTSite\App\Actions\Nights\Dashboard;

use PTSite\App\Models\Night;
use PTSite\App\Models\NightPlayer;
use PTSite\App\Models\NightPrice;
use PTSite\Domain\Attendance\AttendanceAnswer;

/**
 * Fixes a night's money when it is finished (docs/specs/night-dashboard.md, rule 16): every player who answered
 * ALL IN gets a record, and the season's prices are copied to the night. Later changes to the answers or to the
 * season then leave the finished night as it was. Call inside the transaction that finishes the night.
 */
final class FixNightMoney
{
    public function __invoke(Night $night): void
    {
        $recorded = $night->entries()->pluck('player_id')->all();
        $coming = $night->attendances()->where('answer', AttendanceAnswer::AllIn->value)->pluck('player_id');
        foreach ($coming->diff($recorded) as $playerId) {
            NightPlayer::query()->create(['night_id' => $night->id, 'player_id' => $playerId]);
        }

        NightPrice::query()->firstOrCreate(['night_id' => $night->id], $night->season->only([
            'buy_in', 'rebuy_value', 'time_chip_value', 'house_owner_buy_in', 'rebuys_allowed', 'rebuy_charges_time_chip', 'allows_extra_rebuys',
        ]));
    }
}
