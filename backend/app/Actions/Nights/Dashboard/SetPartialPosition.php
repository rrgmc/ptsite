<?php

namespace PTSite\App\Actions\Nights\Dashboard;

use PTSite\App\Models\Night;
use PTSite\App\Models\NightPartialResult;
use PTSite\App\Models\Player;
use PTSite\App\Models\User;
use PTSite\Domain\Nights\NightDashboardRules;
use PTSite\Domain\Nights\NightStatus;
use PTSite\Domain\Scoring\PercentageTable;
use PTSite\Domain\Shared\RuleViolation;

/**
 * Puts a player in one scoring position of an open night's partial result, or empties the position. The other
 * positions stay as they are, so two people filling different positions do not undo each other.
 */
final class SetPartialPosition
{
    public function __construct(private readonly NightEntries $entries, private readonly NightDashboardRules $rules) {}

    public function __invoke(User $user, Night $night, int $position, ?Player $player): Night
    {
        return $this->entries->change($user, $night, null, function (Night $night) use ($user, $position, $player) {
            $this->rules->assertTakesPartialResult(NightStatus::from($night->status));
            if ($position < 1 || $position > PercentageTable::of($night->season->percentByPosition())->scoringPositions()) {
                throw new RuleViolation('night.result.too_many_positions', 'position');
            }

            $partial = NightPartialResult::query()->firstOrNew(['night_id' => $night->id]);
            $partial->fill(['saved_by_user_id' => $user->id, 'saved_at' => now()])->save();
            if ($player !== null) {
                if ($player->isArchived()) {
                    throw new RuleViolation('night.result.unknown_player', 'player_id');
                }
                $other = $partial->positions()->where('player_id', $player->id)->where('position', '!=', $position)->value('position');
                if ($other !== null) {
                    throw new RuleViolation('night.result.duplicate_player', 'player_id', ['position' => $position, 'other_position' => $other]);
                }
                $this->entries->participant($user, $night, $player);
            }

            $partial->positions()->where('position', $position)->delete();
            if ($player !== null) {
                $partial->positions()->create(['position' => $position, 'player_id' => $player->id]);
            }
        });
    }
}
