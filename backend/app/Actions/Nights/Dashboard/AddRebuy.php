<?php

namespace PTSite\App\Actions\Nights\Dashboard;

use PTSite\App\Models\Night;
use PTSite\App\Models\Player;
use PTSite\App\Models\User;
use PTSite\App\Support\NightLedger;
use PTSite\Domain\Nights\NightMoney;

/**
 * "+ Rebuy": records one more rebuy of a player, not paid yet, within what the season allows.
 */
final class AddRebuy
{
    public function __construct(private readonly NightEntries $entries, private readonly NightLedger $ledger) {}

    /**
     * @param  int  $seen  how many rebuys of the player the person saw when they tapped. When the player has
     *                     another number by now, someone else recorded the same rebuy, and nothing is added.
     */
    public function __invoke(User $user, Night $night, Player $player, int $seen): Night
    {
        return $this->entries->change($user, $night, $player, function (Night $night) use ($user, $player, $seen) {
            $this->entries->participant($user, $night, $player);
            $has = $night->rebuys()->where('player_id', $player->id)->count();
            if ($has !== $seen) {
                return;
            }
            (new NightMoney($this->ledger->prices($night)))->assertCanRebuy($has);

            $night->rebuys()->create(['player_id' => $player->id, 'created_by_user_id' => $user->id, 'updated_by_user_id' => $user->id]);
        });
    }
}
