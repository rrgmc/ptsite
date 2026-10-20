<?php

namespace PTSite\Domain\Statistics;

use PTSite\Domain\Standings\StandingRow;

/**
 * The statistics of the final standings of a set of finished seasons ("Campeonatos").
 *
 * A season's 1st place is its champion: a title. Players who share the 1st place share the title, and each counts
 * one. Every list follows {@see Ranking}.
 */
final class ChampionshipStatistics
{
    /** The places of the final standings that count as its podium. */
    public const int PODIUM = 3;

    public function __construct(private readonly Ranking $ranking = new Ranking) {}

    /** @param  list<list<StandingRow>>  $standings  the final standings of each finished season */
    public function summarise(array $standings): ChampionshipSummary
    {
        $titles = $podiums = $appearances = [];
        foreach ($standings as $rows) {
            foreach ($rows as $row) {
                $appearances[$row->playerId] = ($appearances[$row->playerId] ?? 0) + 1;
                if ($row->rank <= self::PODIUM) {
                    $podiums[$row->playerId] = ($podiums[$row->playerId] ?? 0) + 1;
                }
                if ($row->rank === 1) {
                    $titles[$row->playerId] = ($titles[$row->playerId] ?? 0) + 1;
                }
            }
        }

        return new ChampionshipSummary(
            count($standings),
            // Every player with a title: there are few, and each is a champion.
            $this->ranking->top($titles, Ranking::ALL),
            $this->ranking->top($podiums),
            $this->ranking->top($appearances),
        );
    }
}
