<?php

namespace PTSite\App\Actions\Nights;

use PTSite\App\Models\Player;
use PTSite\Domain\Shared\RuleViolation;

/**
 * Checks that the players given for a night's positions exist and are not archived. Inactive players count.
 */
final class KnownPlayers
{
    /** @param list<int> $ids */
    public function assertExist(array $ids): void
    {
        $ids = array_values(array_unique($ids));
        $found = Player::query()->notArchived()->whereIn('id', $ids)->count();
        if ($found !== count($ids)) {
            throw new RuleViolation('night.result.unknown_player', 'positions');
        }
    }
}
