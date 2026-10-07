<?php

namespace PTSite\App\Actions\Auth;

use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use PTSite\App\Models\User;

/**
 * Checks a username and password. Users imported from an older site may still have an MD5 hash (optionally "hash:salt");
 * on their first successful login it is replaced by a modern hash and never used again.
 */
final class LogIn
{
    public function __invoke(string $username, string $password): User
    {
        $user = User::query()->where('username', $username)->first();

        if ($user === null || ! $this->passwordMatches($user, $password)) {
            throw ValidationException::withMessages(['username' => __('auth.failed')]);
        }
        if (! $user->is_enabled) {
            throw ValidationException::withMessages(['username' => __('auth.disabled')]);
        }

        if ($user->legacy_password !== null) {
            $user->password = $password; // hashed by the model cast
            $user->legacy_password = null;
        }
        $user->last_login_at = now();
        $user->save();

        return $user;
    }

    private function passwordMatches(User $user, string $password): bool
    {
        if ($user->password !== null) {
            return Hash::check($password, $user->password);
        }
        if ($user->legacy_password === null) {
            return false;
        }

        [$hash, $salt] = array_pad(explode(':', $user->legacy_password, 2), 2, '');

        return hash_equals(strtolower($hash), md5($password.$salt));
    }
}
