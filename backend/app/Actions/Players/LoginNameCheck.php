<?php

namespace PTSite\App\Actions\Players;

use PTSite\App\Models\User;

/** Usernames are unique, ignoring case. */
final class LoginNameCheck
{
    public static function isTaken(string $username, ?int $exceptUserId = null): bool
    {
        return User::query()
            ->whereRaw('lower(username) = ?', [mb_strtolower(trim($username))])
            ->when($exceptUserId, fn ($q) => $q->whereKeyNot($exceptUserId))
            ->exists();
    }
}
