<?php

namespace PTSite\App\Actions\Nights\Dashboard;

use PTSite\App\Models\Night;
use PTSite\App\Models\NightRebuy;
use PTSite\App\Models\User;

/**
 * Marks one rebuy as paid or not paid, and whether it was paid in cash. The time chip a rebuy charges is paid
 * with it, the same way.
 */
final class MarkRebuy
{
    public function __construct(private readonly NightEntries $entries) {}

    public function __invoke(User $user, Night $night, NightRebuy $rebuy, bool $paid, ?bool $nonCash = null): Night
    {
        return $this->entries->change($user, $night, $rebuy->player, function (Night $night) use ($user, $rebuy, $paid, $nonCash) {
            // Read again under the night's lock: someone else may have removed it.
            $rebuy = $night->rebuys()->whereKey($rebuy->id)->firstOrFail();
            // A rebuy paid not in cash is paid, and one that is not paid was not paid in any way.
            $paid = $paid || $nonCash === true;
            // A rebuy that is already paid keeps its date.
            $rebuy->paid_at = $paid ? ($rebuy->paid_at ?? now()) : null;
            $rebuy->non_cash = $paid && ($nonCash ?? $rebuy->non_cash);
            if ($rebuy->isDirty()) {
                $rebuy->updated_by_user_id = $user->id;
                $rebuy->save();
            }
        });
    }
}
