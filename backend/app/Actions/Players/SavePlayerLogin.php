<?php

namespace PTSite\App\Actions\Players;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use PTSite\App\Enums\Role;
use PTSite\App\Models\Player;
use PTSite\App\Models\User;
use PTSite\App\Support\AuditLogger;
use PTSite\Domain\Accounts\AccountRules;
use PTSite\Domain\Shared\RuleViolation;

/**
 * Gives a player site access, or changes it (admins): the username, the role and a new password. The password is
 * never written to the audit log.
 */
final class SavePlayerLogin
{
    public function __construct(private readonly AuditLogger $audit, private readonly AccountRules $rules) {}

    /** @param array{username?: string, role?: string, password?: string} $data */
    public function __invoke(User $admin, Player $player, array $data): User
    {
        Gate::forUser($admin)->authorize('manageLogin', $player);

        $login = $player->user;
        if ($login === null) {
            foreach (['username', 'password'] as $field) {
                if (! isset($data[$field])) {
                    throw new RuleViolation("account.{$field}_required", $field);
                }
            }
        }
        if (isset($data['username']) && LoginNameCheck::isTaken($data['username'], $login?->id)) {
            throw new RuleViolation('account.username_taken', 'username');
        }
        $role = isset($data['role']) ? Role::from($data['role']) : null;
        $this->rules->assertCanChangeRole($login?->is($admin) ?? false, $role !== null && $role !== $login?->role);

        return DB::transaction(function () use ($admin, $player, $login, $data, $role) {
            $before = $login ? $this->snapshot($login) : null;
            $login ??= new User(['player_id' => $player->id, 'name' => $player->name ?? $player->nickname, 'role' => Role::Player]);

            if (isset($data['username'])) {
                $login->username = trim($data['username']);
            }
            if ($role !== null) {
                $login->role = $role;
            }
            if (isset($data['password'])) {
                $login->password = $data['password'];
                $login->legacy_password = null;
            }
            $login->save();

            $after = $this->snapshot($login) + (isset($data['password']) ? ['password_changed' => true] : []);
            $this->audit->record($admin, $before === null ? 'login.created' : 'login.updated', $login, $before, $after);

            return $login;
        });
    }

    /** @return array<string, mixed> */
    private function snapshot(User $login): array
    {
        return [
            'player_id' => $login->player_id,
            'username' => $login->username,
            'role' => $login->role->value,
        ];
    }
}
