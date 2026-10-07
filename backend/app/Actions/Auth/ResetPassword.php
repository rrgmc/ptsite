<?php

namespace PTSite\App\Actions\Auth;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use PTSite\App\Models\PasswordReset;
use PTSite\App\Models\User;
use PTSite\App\Queries\PendingPasswordReset;
use PTSite\App\Support\AuditLogger;

/**
 * Sets a new password through the link sent by email (docs/specs/accounts-and-roles.md, rule 12). The link is
 * the permission: whoever has it reads the account's mailbox. Every other login of the account ends.
 */
final class ResetPassword
{
    public function __construct(private readonly PendingPasswordReset $pending, private readonly AuditLogger $audit) {}

    public function __invoke(string $token, string $newPassword): User
    {
        $user = ($this->pending)($token)->user;

        return DB::transaction(function () use ($user, $newPassword) {
            $user->password = $newPassword; // hashed by the model cast
            $user->legacy_password = null;
            $user->setRememberToken(Str::random(60));
            $user->save();

            $user->tokens()->delete();
            if (config('session.driver') === 'database') {
                DB::table(config('session.table'))->where('user_id', $user->id)->delete();
            }
            PasswordReset::query()->where('user_id', $user->id)->delete();

            $this->audit->record($user, 'login.password_reset', $user, null, ['password_changed' => true]);

            return $user;
        });
    }
}
