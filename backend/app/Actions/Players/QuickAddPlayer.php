<?php

namespace PTSite\App\Actions\Players;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use PTSite\App\Enums\PlayerStatus;
use PTSite\App\Models\Player;
use PTSite\App\Models\User;
use PTSite\App\Support\AuditLogger;
use PTSite\Domain\Shared\RuleViolation;

/**
 * Adds a first-timer by nickname only, from the results form. The player starts active; details come later.
 */
final class QuickAddPlayer
{
    public function __construct(private readonly AuditLogger $audit) {}

    public function __invoke(User $user, string $nickname): Player
    {
        Gate::forUser($user)->authorize('quickAdd', Player::class);
        $nickname = trim($nickname);
        if (NicknameCheck::isTaken($nickname)) {
            throw new RuleViolation('player.nickname_taken', 'nickname');
        }

        return DB::transaction(function () use ($user, $nickname) {
            $player = Player::create(['nickname' => $nickname, 'status' => PlayerStatus::Active]);
            $this->audit->record($user, 'player.quick_added', $player, null, ['nickname' => $nickname]);

            return $player;
        });
    }
}
