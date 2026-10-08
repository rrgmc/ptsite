<?php

namespace PTSite\App\Actions\Nights\Dashboard;

use PTSite\App\Models\Night;
use PTSite\App\Models\Player;
use PTSite\App\Models\User;
use PTSite\App\Support\AuditLogger;

/**
 * "Dono da casa": says who owns the house where the night is played, or that nobody does. The owner becomes a
 * participant. The change is audited on any night.
 */
final class SetHouseOwner
{
    public function __construct(private readonly NightEntries $entries, private readonly AuditLogger $audit) {}

    public function __invoke(User $user, Night $night, ?Player $player): Night
    {
        return $this->entries->change($user, $night, null, function (Night $night) use ($user, $player) {
            if ($player !== null) {
                $this->entries->participant($user, $night, $player);
            }
            $before = $night->house_owner_player_id;
            if ($before === $player?->id) {
                return;
            }
            $night->update(['house_owner_player_id' => $player?->id]);
            $this->audit->record($user, 'night.house_owner_changed', $night, ['house_owner_player_id' => $before], ['house_owner_player_id' => $player?->id]);
        });
    }
}
