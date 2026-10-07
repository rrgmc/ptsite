<?php

namespace PTSite\Domain\Nights;

use PTSite\Domain\Scoring\PercentageTable;
use PTSite\Domain\Shared\Money;
use PTSite\Domain\Shared\RuleViolation;

/**
 * The game-night lifecycle (scheduled → open → finished) and the rules for entering results.
 */
final class NightRules
{
    /** Only a scheduled night can be opened, and only one night per season can be open at a time. */
    public function assertCanOpen(NightStatus $status, bool $anotherNightIsOpen): void
    {
        if ($status !== NightStatus::Scheduled) {
            throw new RuleViolation('night.open.not_scheduled', null, ['status' => $status->value]);
        }
        if ($anotherNightIsOpen) {
            throw new RuleViolation('night.open.another_open');
        }
    }

    /** Only a scheduled night can be moved ("Remarcar"): an open or finished one is being or has been played. */
    public function assertCanReschedule(NightStatus $status): void
    {
        if ($status !== NightStatus::Scheduled) {
            throw new RuleViolation('night.reschedule.not_scheduled', null, ['status' => $status->value]);
        }
    }

    /** Only a scheduled night can be cancelled ("Cancelar"); a finished one is corrected instead. */
    public function assertCanCancel(NightStatus $status): void
    {
        if ($status !== NightStatus::Scheduled) {
            throw new RuleViolation('night.cancel.not_scheduled', null, ['status' => $status->value]);
        }
    }

    /** An open night can be finished; a finished night can be finished again to correct its results. */
    public function assertCanFinish(NightStatus $status): void
    {
        if ($status === NightStatus::Scheduled) {
            throw new RuleViolation('night.finish.not_open');
        }
    }

    /**
     * Checks a night's result against the season's percentage table:
     * a positive pot, a Main Event pot and a time chip of zero or more, every scoring position filled, and
     * nobody twice.
     */
    public function assertValidResult(NightResult $result, PercentageTable $table): void
    {
        if (! $result->pot->isPositive()) {
            throw new RuleViolation('night.result.pot_required', 'pot');
        }
        if ($result->mainEventPot->compare(Money::zero()) < 0) {
            throw new RuleViolation('night.result.main_event_pot_negative', 'main_event_pot');
        }
        if ($result->timeChip->compare(Money::zero()) < 0) {
            throw new RuleViolation('night.result.time_chip_negative', 'time_chip');
        }

        $this->assertValidPositions($result->playerByPosition, $table);
    }

    /**
     * Every scoring position is filled, no other positions are given, and nobody appears twice.
     *
     * @param  array<int, int>  $playerByPosition  position => player id
     */
    public function assertValidPositions(array $playerByPosition, PercentageTable $table): void
    {
        $this->assertPositionsFit($playerByPosition, $table, allowEmpty: false);
    }

    /** The partial result ("Resultado parcial") is only taken while the night is open. */
    public function assertCanSavePartialResult(NightStatus $status, bool $archived): void
    {
        if ($archived || $status !== NightStatus::Open) {
            throw new RuleViolation('night.partial_result.not_open');
        }
    }

    /**
     * A partial result may leave scoring positions empty, but gives no other positions and nobody twice.
     *
     * @param  array<int, int>  $playerByPosition  position => player id; a missing position is empty
     */
    public function assertValidPartialPositions(array $playerByPosition, PercentageTable $table): void
    {
        $this->assertPositionsFit($playerByPosition, $table, allowEmpty: true);
    }

    /** @param  array<int, int>  $playerByPosition */
    private function assertPositionsFit(array $playerByPosition, PercentageTable $table, bool $allowEmpty): void
    {
        $seen = [];
        for ($position = 1; $position <= $table->scoringPositions(); $position++) {
            $playerId = $playerByPosition[$position] ?? null;
            if ($playerId === null) {
                if ($allowEmpty) {
                    continue;
                }
                throw new RuleViolation('night.result.position_empty', "positions.{$position}", ['position' => $position]);
            }
            if (isset($seen[$playerId])) {
                throw new RuleViolation('night.result.duplicate_player', "positions.{$position}", ['position' => $position, 'other_position' => $seen[$playerId]]);
            }
            $seen[$playerId] = $position;
        }

        $extra = array_diff(array_keys($playerByPosition), range(1, $table->scoringPositions()));
        if ($extra !== []) {
            throw new RuleViolation('night.result.too_many_positions', 'positions');
        }
    }
}
