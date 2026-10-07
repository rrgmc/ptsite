<?php

namespace PTSite\Domain\Scoring;

use PTSite\Domain\Shared\RuleViolation;

/**
 * Each scoring position's share of the pot, in whole percent. Positions start at 1 and the shares add up to 100.
 */
final readonly class PercentageTable
{
    /** @param array<int, int> $percentByPosition position => percent */
    private function __construct(public array $percentByPosition) {}

    /** @param array<int, int> $percentByPosition position => percent */
    public static function of(array $percentByPosition): self
    {
        ksort($percentByPosition);
        if ($percentByPosition === [] || array_keys($percentByPosition) !== range(1, count($percentByPosition))) {
            throw new RuleViolation('percentage_table.positions', 'percentages');
        }
        foreach ($percentByPosition as $position => $percent) {
            if ($percent < 0 || $percent > 100) {
                throw new RuleViolation('percentage_table.range', "percentages.{$position}");
            }
        }
        $total = array_sum($percentByPosition);
        if ($total !== 100) {
            throw new RuleViolation('percentage_table.total', 'percentages', ['total' => $total]);
        }

        return new self($percentByPosition);
    }

    /** The table a new season starts with: 38, 23, 15, 11, 8, 5. */
    public static function standard(): self
    {
        return self::of([1 => 38, 2 => 23, 3 => 15, 4 => 11, 5 => 8, 6 => 5]);
    }

    public function scoringPositions(): int
    {
        return count($this->percentByPosition);
    }

    public function percentFor(int $position): int
    {
        return $this->percentByPosition[$position] ?? 0;
    }
}
