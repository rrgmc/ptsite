<?php

namespace PTSite\App\Actions\Auth;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use PTSite\App\Models\User;
use PTSite\App\Support\AuditLogger;
use PTSite\Domain\Shared\RuleViolation;

/**
 * Changes the logged-in user's own password. The user must type the current one, so that someone who finds the
 * site open on another person's phone cannot take the account.
 *
 * The user's API tokens are deleted, except the one that made the request: other apps must log in again.
 * The audit log records that the password changed, never the password.
 */
final class ChangeOwnPassword
{
    public function __construct(private readonly AuditLogger $audit) {}

    /** @param  int|null  $keepTokenId  the API token the request came with, if any */
    public function __invoke(User $user, string $currentPassword, string $newPassword, ?int $keepTokenId = null): User
    {
        if ($user->password === null || ! Hash::check($currentPassword, $user->password)) {
            throw new RuleViolation('account.wrong_current_password', 'current_password');
        }

        return DB::transaction(function () use ($user, $newPassword, $keepTokenId) {
            $user->password = $newPassword; // hashed by the model cast
            $user->legacy_password = null;
            $user->save();
            $user->tokens()->when($keepTokenId !== null, fn ($tokens) => $tokens->whereKeyNot($keepTokenId))->delete();

            $this->audit->record($user, 'login.password_changed', $user, null, ['password_changed' => true]);

            return $user;
        });
    }
}
