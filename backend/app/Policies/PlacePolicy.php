<?php

namespace PTSite\App\Policies;

use PTSite\App\Models\Place;
use PTSite\App\Models\User;

class PlacePolicy
{
    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function update(User $user, Place $place): bool
    {
        return $user->isAdmin();
    }
}
