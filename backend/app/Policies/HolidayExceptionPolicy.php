<?php

namespace PTSite\App\Policies;

use PTSite\App\Models\HolidayException;
use PTSite\App\Models\User;

class HolidayExceptionPolicy
{
    public function delete(User $user, HolidayException $exception): bool
    {
        return $user->isAdmin();
    }
}
