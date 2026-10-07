<?php

/*
 * Mirrors the site access rules in docs/specs/accounts-and-roles.md that need no database. The examples are
 * covered in tests/Feature/PlayerLoginTest.php.
 */

use PTSite\Domain\Accounts\AccountRules;
use PTSite\Domain\Shared\RuleViolation;

it('refuses a change to your own role, so an admin never locks themself out', function () {
    expect(fn () => (new AccountRules)->assertCanChangeRole(ownLogin: true, roleChanges: true))
        ->toThrow(RuleViolation::class, 'account.own_role');
});

it('allows changing someone else\'s role, and your own login without its role', function (bool $own, bool $changes) {
    expect(fn () => (new AccountRules)->assertCanChangeRole($own, $changes))->not->toThrow(RuleViolation::class);
})->with([
    'someone else' => [false, true],
    'own login, same role' => [true, false],
]);
