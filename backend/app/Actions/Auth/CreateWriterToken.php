<?php

namespace PTSite\App\Actions\Auth;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use PTSite\App\Enums\Role;
use PTSite\App\Models\User;
use PTSite\App\Support\AuditLogger;
use PTSite\Domain\Shared\RuleViolation;

/**
 * Gives a program that writes texts an API token (docs/specs/accounts-and-roles.md, rule 13). The account has the
 * writer role, no player and no password, so the token is its only way in. It is made the first time.
 * An admin does it through the API; on the server's console nobody is asked, so $admin is null.
 */
final class CreateWriterToken
{
    public function __construct(private readonly AuditLogger $audit) {}

    /** @return array{token: string, writer: User} the token, shown once, and its account */
    public function __invoke(?User $admin, string $username, string $tokenName, bool $replace): array
    {
        if ($admin !== null) {
            Gate::forUser($admin)->authorize('createWriterToken', User::class);
        }
        $writer = User::query()->where('username', $username)->first();
        if ($writer !== null && $writer->role !== Role::Writer) {
            throw new RuleViolation('account.not_writer', 'username');
        }

        return DB::transaction(function () use ($admin, $writer, $username, $tokenName, $replace) {
            if ($writer === null) {
                $writer = User::create(['username' => $username, 'name' => $username, 'role' => Role::Writer, 'is_enabled' => true]);
                $this->audit->record($admin, 'account.writer_created', $writer, null, ['username' => $username]);
            }
            if ($replace) {
                $writer->tokens()->delete();
            }
            $token = $writer->createToken($tokenName)->plainTextToken;
            $this->audit->record($admin, 'account.writer_token_created', $writer, null, ['token_name' => $tokenName, 'replaced' => $replace]);

            return ['token' => $token, 'writer' => $writer];
        });
    }
}
