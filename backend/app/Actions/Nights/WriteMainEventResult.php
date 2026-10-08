<?php

namespace PTSite\App\Actions\Nights;

use PTSite\App\Models\Night;
use PTSite\Domain\Nights\NightRules;

/**
 * Checks a Main Event's result against the rules and saves it, marking the night finished. There is no pot and
 * there are no points: only the order of the players. Shared by FinishMainEventNight and ImportMainEventNight,
 * which handle permissions and the audit log. Call inside a transaction.
 */
final class WriteMainEventResult
{
    public function __construct(
        private readonly NightRules $rules,
        private readonly KnownPlayers $players,
    ) {}

    /** @param list<int> $playerIds the 1st place first */
    public function __invoke(Night $night, array $playerIds): void
    {
        $playerIds = array_values($playerIds);
        $this->rules->assertValidMainEventOrder($playerIds);
        $this->players->assertExist($playerIds, 'night.main_event.unknown_player', 'player_ids');

        $night->mainEventPositions()->delete();
        foreach ($playerIds as $index => $playerId) {
            $night->mainEventPositions()->create(['position' => $index + 1, 'player_id' => $playerId]);
        }
        $night->forceFill(['status' => 'finished'])->save();
        $night->unsetRelation('mainEventPositions');
    }
}
