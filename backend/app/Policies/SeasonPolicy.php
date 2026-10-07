<?php

namespace PTSite\App\Policies;

use PTSite\App\Models\Season;
use PTSite\App\Models\User;

class SeasonPolicy
{
    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function update(User $user, Season $season): bool
    {
        return $user->isAdmin();
    }
}
