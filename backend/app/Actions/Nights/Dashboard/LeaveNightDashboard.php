<?php

namespace PTSite\App\Actions\Nights\Dashboard;

use PTSite\App\Models\Night;
use PTSite\App\Models\Player;
use PTSite\App\Models\User;
use PTSite\App\Support\AuditLogger;
use PTSite\App\Support\NightLedger;
use PTSite\Domain\Nights\NightDashboardRules;

/**
 * Takes a player out of a night's dashboard: when they answer FOLD, lose their answer or are removed. Refused
 * while a mark or a rebuy is recorded for them. Removes their record and, if they own the house, that too.
 * Call inside a transaction.
 */
final class LeaveNightDashboard
{
    public function __construct(
        private readonly NightDashboardRules $rules,
        private readonly NightLedger $ledger,
        private readonly AuditLogger $audit,
    ) {}

    public function __invoke(User $user, Night $night, Player $player): void
    {
        // The lock keeps a payment from being recorded for the player at the same moment.
        $night = Night::query()->whereKey($night->id)->lockForUpdate()->firstOrFail();
        $this->rules->assertCanLeave($this->ledger->entries($night)[$player->id] ?? null);

        $night->entries()->where('player_id', $player->id)->delete();
        if ($night->house_owner_player_id === $player->id) {
            $night->update(['house_owner_player_id' => null]);
            $this->audit->record($user, 'night.house_owner_changed', $night, ['house_owner_player_id' => $player->id], ['house_owner_player_id' => null]);
        }
    }
}
