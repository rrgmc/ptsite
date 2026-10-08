<?php

namespace PTSite\App\Actions\Nights\Dashboard;

use PTSite\App\Models\Night;
use PTSite\App\Models\User;

/**
 * "Ajuste fora do dinheiro": sets an amount typed by hand that is added to what the night's players paid not in
 * cash, for anything out of the ordinary. It may be negative. Null takes it away. It is kept on the night, so
 * it stays when the night is finished.
 */
final class SetNonCashAdjustment
{
    public function __construct(private readonly NightEntries $entries) {}

    /** @param  ?string  $amount  a decimal string, or null for no adjustment */
    public function __invoke(User $user, Night $night, ?string $amount): Night
    {
        return $this->entries->change($user, $night, null, function (Night $night) use ($amount) {
            $night->update(['non_cash_adjustment' => $amount]);
        });
    }
}
