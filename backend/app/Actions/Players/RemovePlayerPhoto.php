<?php

namespace PTSite\App\Actions\Players;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use PTSite\App\Models\Player;
use PTSite\App\Models\User;
use PTSite\App\Support\AuditLogger;

/**
 * Removes a player's photo and thumbnail together. Admins, and the player themself. Does nothing when there is
 * neither.
 */
final class RemovePlayerPhoto
{
    public function __construct(private readonly AuditLogger $audit) {}

    public function __invoke(User $user, Player $player): Player
    {
        Gate::forUser($user)->authorize('updateProfile', $player);

        $before = $player->only(['thumbnail_version', 'photo_version']);
        if ($before === ['thumbnail_version' => null, 'photo_version' => null]) {
            return $player;
        }

        return DB::transaction(function () use ($user, $player, $before) {
            $after = ['thumbnail_version' => null, 'photo_version' => null];
            $player->images()->delete();
            $player->forceFill($after)->save();

            $this->audit->record($user, 'player.image_removed', $player, $before, $after);

            return $player;
        });
    }
}
