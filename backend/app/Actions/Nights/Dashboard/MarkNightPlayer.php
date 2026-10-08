<?php

namespace PTSite\App\Actions\Nights\Dashboard;

use PTSite\App\Models\Night;
use PTSite\App\Models\Player;
use PTSite\App\Models\User;
use PTSite\Domain\Features\Feature;
use PTSite\Domain\Features\Features;

/**
 * Sets a participant's marks on the night dashboard: the buy-in paid, the time chip owed and the time chip
 * paid. With no mark it only makes the player a participant ("ALL IN").
 */
final class MarkNightPlayer
{
    public function __construct(private readonly NightEntries $entries, private readonly Features $features) {}

    /** Null leaves a mark as it is. */
    public function __invoke(User $user, Night $night, Player $player, ?bool $buyInPaid = null, ?bool $timeChip = null, ?bool $timeChipPaid = null): Night
    {
        return $this->entries->change($user, $night, $player, function (Night $night) use ($user, $player, $buyInPaid, $timeChip, $timeChipPaid) {
            $row = $this->entries->participant($user, $night, $player);
            if (! $this->features->enabled(Feature::TimeChip)) {
                $timeChip = $timeChipPaid = null;
            }
            // A time chip that is paid is owed, and one that is not owed is not paid.
            if ($timeChip === false) {
                $timeChipPaid = false;
            } elseif ($timeChipPaid === true) {
                $timeChip = true;
            }

            $marks = ['buy_in_paid_at' => $buyInPaid, 'time_chip_at' => $timeChip, 'time_chip_paid_at' => $timeChipPaid];
            foreach ($marks as $column => $set) {
                if ($set !== null) {
                    // A mark that is already set keeps its date.
                    $row->{$column} = $set ? ($row->{$column} ?? now()) : null;
                }
            }
            if ($row->isDirty()) {
                $row->updated_by_user_id = $user->id;
                $row->save();
            }
        });
    }
}
