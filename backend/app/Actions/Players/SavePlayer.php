<?php

namespace PTSite\App\Actions\Players;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use PTSite\App\Models\Player;
use PTSite\App\Models\User;
use PTSite\App\Support\AuditLogger;
use PTSite\Domain\Shared\RuleViolation;

/**
 * Creates or updates a player (admins). Also switches a player between active and inactive, and archives or
 * restores them, and writes the memo. A player can update their own profile: nickname, name, email and birthday.
 */
final class SavePlayer
{
    public function __construct(private readonly AuditLogger $audit) {}

    /** @param array{nickname?: string, name?: ?string, email?: ?string, birth_date?: ?string, memo?: ?string, status?: string, archived?: bool} $data */
    public function __invoke(User $user, ?Player $player, array $data): Player
    {
        // A player changes their own profile, but not their memo or status, and cannot archive themself.
        $adminOnly = array_intersect_key($data, array_flip(['memo', 'status', 'archived'])) !== [];
        match (true) {
            $player === null => Gate::forUser($user)->authorize('create', Player::class),
            $adminOnly => Gate::forUser($user)->authorize('update', $player),
            default => Gate::forUser($user)->authorize('updateProfile', $player),
        };

        if (isset($data['nickname']) && NicknameCheck::isTaken($data['nickname'], $player?->id)) {
            throw new RuleViolation('player.nickname_taken', 'nickname');
        }

        return DB::transaction(function () use ($user, $player, $data) {
            $player ??= new Player(['status' => 'active']);
            $before = $player->exists ? $this->snapshot($player) : null;

            $player->fill(array_intersect_key($data, array_flip(['nickname', 'name', 'email', 'birth_date', 'memo', 'status'])));
            if (array_key_exists('archived', $data)) {
                $player->archived_at = $data['archived'] ? ($player->archived_at ?? now()) : null;
            }
            $player->save();

            $this->audit->record($user, $before === null ? 'player.created' : 'player.updated', $player, $before, $this->snapshot($player));

            return $player;
        });
    }

    /** @return array<string, mixed> */
    private function snapshot(Player $player): array
    {
        return [
            'nickname' => $player->nickname,
            'name' => $player->name,
            'email' => $player->email,
            'birth_date' => $player->birth_date?->toDateString(),
            'memo' => $player->memo,
            'status' => $player->status?->value,
            'archived' => $player->archived_at !== null,
        ];
    }
}
