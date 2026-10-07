<?php

namespace PTSite\Domain\Accounts;

use PTSite\Domain\Shared\RuleViolation;

/** Rules for site access (docs/specs/accounts-and-roles.md). */
final class AccountRules
{
    /**
     * Nobody changes their own role, so an admin can't lock themself out. This also keeps at least one admin:
     * whoever demotes an admin is an admin too.
     */
    public function assertCanChangeRole(bool $ownLogin, bool $roleChanges): void
    {
        if ($ownLogin && $roleChanges) {
            throw new RuleViolation('account.own_role', 'role');
        }
    }
}
