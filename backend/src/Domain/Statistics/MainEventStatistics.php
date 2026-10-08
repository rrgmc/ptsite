<?php

namespace PTSite\Domain\Statistics;

/**
 * The statistics of a set of finished Main Events: one season's, or every season's.
 *
 * A Main Event records only the order of its players, so its lists count places, not points. Every list
 * follows {@see Ranking}.
 */
final class MainEventStatistics
{
    /** The first places of a Main Event that count as its podium. */
    public const int PODIUM = 3;

    public function __construct(private readonly Ranking $ranking = new Ranking) {}

    /** @param  list<list<int>>  $orders  the player ids of each Main Event, first place first */
    public function summarise(array $orders): MainEventSummary
    {
        $titles = $podiums = $appearances = [];
        foreach ($orders as $order) {
            foreach (array_values($order) as $index => $playerId) {
                $appearances[$playerId] = ($appearances[$playerId] ?? 0) + 1;
                if ($index < self::PODIUM) {
                    $podiums[$playerId] = ($podiums[$playerId] ?? 0) + 1;
                }
                if ($index === 0) {
                    $titles[$playerId] = ($titles[$playerId] ?? 0) + 1;
                }
            }
        }

        return new MainEventSummary(
            count($orders),
            $this->ranking->top($titles),
            $this->ranking->top($podiums),
            $this->ranking->top($appearances),
        );
    }
}
