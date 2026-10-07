<?php

namespace PTSite\App\Queries;

use PTSite\App\Models\PasswordReset;
use PTSite\Domain\Accounts\PasswordResetRules;

/**
 * The password link behind a token, when it still works (docs/specs/accounts-and-roles.md, rule 12). Only the
 * hash of the token is stored.
 */
final class PendingPasswordReset
{
    public function __construct(private readonly PasswordResetRules $rules) {}

    public function __invoke(string $token): PasswordReset
    {
        $reset = PasswordReset::query()->with('user')->where('token_hash', hash('sha256', $token))->first();
        // A link of a disabled account is treated like a link that does not exist.
        if ($reset !== null && ! $reset->user->is_enabled) {
            $reset = null;
        }
        $this->rules->assertUsable($reset?->expires_at, now());

        return $reset;
    }
}
