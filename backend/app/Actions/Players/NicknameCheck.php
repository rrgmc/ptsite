<?php

namespace PTSite\App\Actions\Players;

use PTSite\App\Models\Player;

/** Nicknames are unique across all players, including inactive and archived ones, ignoring case. */
final class NicknameCheck
{
    public static function isTaken(string $nickname, ?int $exceptPlayerId = null): bool
    {
        return Player::query()
            ->whereRaw('lower(nickname) = ?', [mb_strtolower(trim($nickname))])
            ->when($exceptPlayerId, fn ($q) => $q->whereKeyNot($exceptPlayerId))
            ->exists();
    }
}
