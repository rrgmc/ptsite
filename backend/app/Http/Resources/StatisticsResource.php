<?php

namespace PTSite\App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use PTSite\App\Queries\StatisticsReport;

/** @mixin StatisticsReport */
class StatisticsResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            /** Null for every season. */
            'season_id' => $this->seasonId,
            /** How many finished nights count. */
            'nights_count' => $this->nightsCount,
            'pot_total' => $this->potTotal,
            /** The Main Event pots of those nights, added up. */
            'main_event_pot_total' => $this->mainEventPotTotal,
            /** The time chips of those nights, added up. */
            'time_chip_total' => $this->timeChipTotal,
            /** Players by total points (`amount`). */
            'total_points' => new RankedListResource($this->totalPoints),
            /** Players by nights on which they scored (`count`). */
            'nights_scored' => new RankedListResource($this->nightsScored),
            /** One list per finishing position: players by times in that position (`count`). */
            'positions' => RankedListResource::collection($this->positions),
            /** Nights by pot (`amount`). */
            'biggest_pots' => new RankedListResource($this->biggestPots),
            /** Places by number of nights (`count`). */
            'places' => new RankedListResource($this->places),
            /** The running total of the eight players with most points: per night in a season, per season otherwise. */
            'points_progress' => [
                /**
                 * Oldest first. `night_id` and `starts_at` are null when the step is a season.
                 *
                 * @var list<array{night_id: int|null, starts_at: string|null, season_id: int, season_name: string}>
                 */
                'steps' => $this->progressSteps,
                /**
                 * Leaders first. `points` holds the total after each step, as decimal strings.
                 *
                 * @var list<array{player: PlayerResource, points: list<string>}>
                 */
                'series' => array_map(fn (array $series) => [
                    'player' => new PlayerResource($series['player']),
                    'points' => $series['points'],
                ], $this->progressSeries),
                /**
                 * The pot of each step, as decimal strings: of the night, or of the season's nights added up.
                 *
                 * @var list<string>
                 */
                'pots' => $this->progressPots,
            ],
            /** First places of the players who are not in the first "Posição" list ("Outros"). */
            'wins_not_shown' => $this->winsNotShown,
            /**
             * Every player who scored, with the times in each scoring position (zeros included), ordered as a
             * medal table: most 1st places first, then most 2nd places, and so on. Equal lines share a `rank`.
             *
             * @var list<array{rank: int, player: PlayerResource, positions: list<array{position: int, count: int}>}>
             */
            'position_table' => array_map(fn (array $row) => [
                'rank' => $row['rank'],
                'player' => new PlayerResource($row['player']),
                'positions' => $row['positions'],
            ], $this->positionTable),
            /** The lists of the finished Main Events of the same seasons. Null on a site with no Main Event. */
            'main_event' => $this->mainEvent === null ? null : new MainEventStatisticsResource($this->mainEvent),
        ];
    }
}
