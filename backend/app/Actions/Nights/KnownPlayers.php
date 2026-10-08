<?php

namespace PTSite\App\Actions\Nights;

use PTSite\App\Models\Player;
use PTSite\Domain\Shared\RuleViolation;

/**
 * Checks that the players given for a night's positions exist and are not archived. Inactive players count.
 */
final class KnownPlayers
{
    /**
     * @param  list<int>  $ids
     * @param  string  $rule  the rule broken by a player that is missing or archived
     * @param  string  $field  the field of the request the players came in
     */
    public function assertExist(array $ids, string $rule = 'night.result.unknown_player', string $field = 'positions'): void
    {
        $ids = array_values(array_unique($ids));
        $found = Player::query()->notArchived()->whereIn('id', $ids)->count();
        if ($found !== count($ids)) {
            throw new RuleViolation($rule, $field);
        }
    }
}
