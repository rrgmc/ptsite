<?php

namespace PTSite\App\Policies;

use PTSite\App\Models\User;

class AuditLogPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin();
    }
}
