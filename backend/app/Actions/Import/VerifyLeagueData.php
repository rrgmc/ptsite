<?php

namespace PTSite\App\Actions\Import;

use PTSite\App\Models\Night;
use PTSite\Domain\Scoring\PercentageTable;
use PTSite\Domain\Scoring\PointsCalculator;
use PTSite\Domain\Shared\Money;
use PTSite\Domain\Shared\RuleViolation;

/**
 * Re-checks every finished night against the rules: its points add up to its pot, and each line equals
 * pot × percentage ÷ 100 for the season's table. Reports problems; changes nothing.
 */
final class VerifyLeagueData
{
    public function __construct(private readonly PointsCalculator $calculator) {}

    /** @return array{nights_checked: int, problems: list<string>} */
    public function __invoke(): array
    {
        $problems = [];
        $checked = 0;

        Night::query()->finished()->with(['results', 'season.percentages'])->orderBy('starts_at')
            ->each(function (Night $night) use (&$problems, &$checked) {
                $checked++;
                $label = "Night {$night->id} ({$night->starts_at->format('d/m/Y')}, {$night->season->name})";
                try {
                    $table = PercentageTable::of($night->season->percentByPosition());
                } catch (RuleViolation $e) {
                    $problems[] = "{$label}: season percentage table is invalid ({$e->rule}).";

                    return;
                }

                $pot = Money::fromDecimal((string) $night->pot);
                $expected = $this->calculator->calculate($pot, $table);
                $total = Money::zero();
                foreach ($night->results as $line) {
                    $points = Money::fromDecimal((string) $line->points);
                    $total = $total->plus($points);
                    $should = $expected[$line->position] ?? Money::zero();
                    if (! $points->equals($should)) {
                        $problems[] = "{$label}: position {$line->position} has {$points->toDecimal()}, expected {$should->toDecimal()}.";
                    }
                }
                if ($night->results->count() !== $table->scoringPositions()) {
                    $problems[] = "{$label}: {$night->results->count()} result lines, expected {$table->scoringPositions()}.";
                }
                if (! $total->equals($pot)) {
                    $problems[] = "{$label}: points add up to {$total->toDecimal()}, pot is {$pot->toDecimal()}.";
                }
            });

        return ['nights_checked' => $checked, 'problems' => $problems];
    }
}
