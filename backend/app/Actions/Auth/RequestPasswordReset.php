<?php

namespace PTSite\App\Actions\Auth;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use PTSite\App\Mail\PasswordResetMail;
use PTSite\App\Models\PasswordReset;
use PTSite\App\Models\User;
use PTSite\App\Support\AuditLogger;
use PTSite\Domain\Accounts\PasswordResetRules;
use PTSite\Domain\Shared\RuleViolation;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;

/**
 * Sends the password link to a user who forgot the password (docs/specs/accounts-and-roles.md, rule 12).
 * Anyone can ask, so there is no policy to check; the rules decide which address may get a link.
 */
final class RequestPasswordReset
{
    public function __construct(private readonly PasswordResetRules $rules, private readonly AuditLogger $audit) {}

    /**
     * @param  string  $login  a username or an email
     * @return string the address the link went to, with most of its name hidden
     */
    public function __invoke(string $login): string
    {
        $users = $this->accountsOf(trim($login));
        if ($users->isEmpty()) {
            throw new RuleViolation('password_reset.unknown_account', 'login');
        }
        $users = $users->where('is_enabled', true)->values();
        if ($users->isEmpty()) {
            throw new RuleViolation('password_reset.disabled', 'login');
        }

        // Accounts found by email all share that address, so the first one's address is everyone's.
        $address = $this->addressOf($users->first());
        $this->rules->assertUsableAddress($address);

        $resets = PasswordReset::query()->whereIn('user_id', $users->modelKeys());
        if ((clone $resets)->where('created_at', '>', now()->subSeconds(config('ptsite.password_reset.resend_seconds')))->exists()) {
            throw new RuleViolation('password_reset.too_soon', 'login');
        }

        // The host runs no scheduled jobs, so old links are cleared here.
        PasswordReset::query()->where('expires_at', '<', now()->subDay())->delete();

        try {
            return DB::transaction(function () use ($users, $address) {
                $masked = $this->rules->mask($address);
                $minutes = (int) config('ptsite.password_reset.expire_minutes');
                $links = [];
                foreach ($users as $user) {
                    $token = Str::random(64);
                    PasswordReset::query()->where('user_id', $user->id)->delete();
                    PasswordReset::create([
                        'user_id' => $user->id,
                        'token_hash' => hash('sha256', $token),
                        'expires_at' => now()->addMinutes($minutes),
                        'created_at' => now(),
                    ]);
                    // Nobody is logged in, so the entry has no author.
                    $this->audit->record(null, 'login.password_reset_requested', $user, null, ['email' => $masked]);
                    $links[] = [
                        'username' => $user->username,
                        // From APP_URL, not from the request: a forged Host header must not change the link.
                        'url' => rtrim(config('app.url'), '/').'/app/reset-password?token='.$token,
                    ];
                }

                Mail::to($address)->send(new PasswordResetMail($links, $minutes));

                return $masked;
            });
        } catch (TransportExceptionInterface $e) {
            report($e);
            throw new RuleViolation('password_reset.mail_failed', 'login');
        }
    }

    /**
     * The account with this username or, failing that, every account with this email.
     *
     * @return Collection<int, User>
     */
    private function accountsOf(string $login): Collection
    {
        $byUsername = User::query()->with('player')->where('username', $login)->get();
        if ($byUsername->isNotEmpty() || ! str_contains($login, '@')) {
            return $byUsername;
        }

        $email = mb_strtolower($login);

        return User::query()->with('player')
            ->where(fn ($q) => $q
                ->whereHas('player', fn ($player) => $player->whereRaw('lower(email) = ?', [$email]))
                ->orWhere(fn ($q) => $q->whereNull('player_id')->whereRaw('lower(email) = ?', [$email])))
            ->orderBy('username')
            ->get();
    }

    /**
     * The player's email, the one edited in "Meu perfil". An account with no player has only its own email,
     * which may come from an import.
     */
    private function addressOf(User $user): ?string
    {
        return $user->player_id !== null ? $user->player?->email : $user->email;
    }
}
