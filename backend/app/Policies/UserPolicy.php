<?php

namespace PTSite\App\Policies;

use PTSite\App\Models\User;

class UserPolicy
{
    /** A token for a writer account, the account of a program that writes texts: admins. */
    public function createWriterToken(User $user): bool
    {
        return $user->isAdmin();
    }
}
