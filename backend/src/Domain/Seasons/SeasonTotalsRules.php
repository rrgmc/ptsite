<?php

namespace PTSite\Domain\Seasons;

use PTSite\Domain\Scoring\PercentageTable;
use PTSite\Domain\Shared\RuleViolation;
use PTSite\Domain\Standings\TotalsLine;

/**
 * The rules of a season known only by its final standings ("só totais"): for each player, the total points and how
 * often the player finished in each scoring position. Such a season has no regular night.
 */
final class SeasonTotalsRules
{
    /** A season's final lines replace its nights, so a season with a regular night, or an archived one, takes none. */
    public function assertCanSaveTotals(bool $hasRegularNights, bool $archived): void
    {
        if ($archived) {
            throw new RuleViolation('season.not_open');
        }
        if ($hasRegularNights) {
            throw new RuleViolation('season.totals.has_nights');
        }
    }

    /**
     * Each player once, a count of zero or more for each scoring position, and points of zero or more. The counts
     * of a position need not add up to the rounds: the final standings are kept as the league recorded them. No
     * line at all is allowed, and clears the season's final lines.
     *
     * @param  list<TotalsLine>  $lines
     */
    public function assertValidTotals(array $lines, PercentageTable $table): void
    {
        $positions = $table->scoringPositions();
        $seen = [];
        foreach ($lines as $index => $line) {
            if (isset($seen[$line->playerId])) {
                throw new RuleViolation('season.totals.duplicate_player', "rows.{$index}.player_id");
            }
            $seen[$line->playerId] = true;
            if (array_keys($line->positions) !== range(1, $positions) || min($line->positions) < 0) {
                throw new RuleViolation('season.totals.positions', "rows.{$index}.positions", ['positions' => $positions]);
            }
            if ($line->points->cents < 0) {
                throw new RuleViolation('season.totals.points_negative', "rows.{$index}.points");
            }
        }
    }

    /** A season known only by its final standings takes no regular night; its Main Event may still be recorded. */
    public function assertTakesRegularNights(bool $totalsOnly): void
    {
        if ($totalsOnly) {
            throw new RuleViolation('season.totals_only');
        }
    }

    /** The percentage table of a season known only by its final standings gives the positions of its lines. */
    public function assertCanChangeTable(bool $totalsOnly, bool $tableChanged): void
    {
        if ($totalsOnly && $tableChanged) {
            throw new RuleViolation('season.totals.locked');
        }
    }
}
