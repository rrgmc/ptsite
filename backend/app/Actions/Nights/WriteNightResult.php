<?php

namespace PTSite\App\Actions\Nights;

use PTSite\App\Models\Night;
use PTSite\Domain\Features\Feature;
use PTSite\Domain\Features\Features;
use PTSite\Domain\Nights\NightResult;
use PTSite\Domain\Nights\NightRules;
use PTSite\Domain\Scoring\PercentageTable;
use PTSite\Domain\Scoring\PointsCalculator;
use PTSite\Domain\Shared\Money;

/**
 * Checks a night's result against the rules, calculates the points and saves them, marking the night finished.
 * Shared by FinishNight and ImportNight, which handle permissions and the audit log. Call inside a transaction.
 */
final class WriteNightResult
{
    public function __construct(
        private readonly NightRules $rules,
        private readonly PointsCalculator $calculator,
        private readonly KnownPlayers $players,
        private readonly Features $features,
    ) {}

    /**
     * An amount of a feature this site has turned off is not kept, whatever was sent.
     *
     * @param  array<int, int>  $playerByPosition  position => player id
     */
    public function __invoke(Night $night, string $pot, ?string $mainEventPot, ?string $timeChip, array $playerByPosition): void
    {
        $table = PercentageTable::of($night->season->percentByPosition());
        $result = new NightResult(
            Money::fromDecimal($pot),
            $this->amount(Feature::MainEventPot, $mainEventPot),
            $this->amount(Feature::TimeChip, $timeChip),
            $playerByPosition,
        );
        $this->rules->assertValidResult($result, $table, $this->features);
        $this->players->assertExist(array_values($playerByPosition));

        $points = $this->calculator->calculate($result->pot, $table);

        $night->results()->delete();
        foreach ($playerByPosition as $position => $playerId) {
            $night->results()->create([
                'position' => $position,
                'player_id' => $playerId,
                'points' => $points[$position]->toDecimal(),
            ]);
        }
        $night->forceFill([
            'status' => 'finished',
            'pot' => $result->pot->toDecimal(),
            'main_event_pot' => $result->mainEventPot?->toDecimal(),
            'time_chip' => $result->timeChip?->toDecimal(),
        ])->save();
        $night->unsetRelation('results');
    }

    private function amount(Feature $feature, ?string $value): ?Money
    {
        return $value !== null && $this->features->enabled($feature) ? Money::fromDecimal($value) : null;
    }
}
