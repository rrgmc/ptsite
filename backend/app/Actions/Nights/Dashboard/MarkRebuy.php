<?php

namespace PTSite\App\Actions\Nights\Dashboard;

use PTSite\App\Models\Night;
use PTSite\App\Models\NightRebuy;
use PTSite\App\Models\User;

/** Marks one rebuy as paid or not paid. The time chip a rebuy charges is paid with it. */
final class MarkRebuy
{
    public function __construct(private readonly NightEntries $entries) {}

    public function __invoke(User $user, Night $night, NightRebuy $rebuy, bool $paid): Night
    {
        return $this->entries->change($user, $night, $rebuy->player, function (Night $night) use ($user, $rebuy, $paid) {
            // Read again under the night's lock: someone else may have removed it.
            $rebuy = $night->rebuys()->whereKey($rebuy->id)->firstOrFail();
            if (($rebuy->paid_at !== null) !== $paid) {
                $rebuy->update(['paid_at' => $paid ? now() : null, 'updated_by_user_id' => $user->id]);
            }
        });
    }
}
