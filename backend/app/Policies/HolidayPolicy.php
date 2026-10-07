<?php

namespace PTSite\App\Policies;

use PTSite\App\Models\Holiday;
use PTSite\App\Models\User;

/** Anyone logged in can see the holidays; only admins change them and their yearly exceptions. */
class HolidayPolicy
{
    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function update(User $user, Holiday $holiday): bool
    {
        return $user->isAdmin();
    }
}
