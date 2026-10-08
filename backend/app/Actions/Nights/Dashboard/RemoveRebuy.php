<?php

namespace PTSite\App\Actions\Nights\Dashboard;

use PTSite\App\Models\Night;
use PTSite\App\Models\NightRebuy;
use PTSite\App\Models\User;

/** Removes a rebuy that was recorded by mistake. */
final class RemoveRebuy
{
    public function __construct(private readonly NightEntries $entries) {}

    public function __invoke(User $user, Night $night, NightRebuy $rebuy): Night
    {
        return $this->entries->change($user, $night, $rebuy->player, function (Night $night) use ($rebuy) {
            // Removing one that someone else already removed changes nothing.
            $night->rebuys()->whereKey($rebuy->id)->delete();
        });
    }
}
