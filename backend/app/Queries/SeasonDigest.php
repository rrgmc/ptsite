<?php

namespace PTSite\App\Queries;

use PTSite\App\Models\Night;
use PTSite\App\Models\NightResult;
use PTSite\App\Models\Player;
use PTSite\App\Models\Season;
use PTSite\Domain\Shared\Money;
use PTSite\Domain\Standings\ScoreLine;
use PTSite\Domain\Standings\Standings;
use PTSite\Domain\Standings\StandingsDigest;

/**
 * Everything a recap of the season needs, in one read (docs/specs/season-recaps.md, "Digest"): the standings and
 * how they moved on the latest night, that night, the next one, how many rounds are left and the latest recaps.
 */
final class SeasonDigest
{
    public const int RECAPS = 3;

    public function __construct(
        private readonly Standings $standings,
        private readonly StandingsDigest $digest,
        private readonly SeasonStandings $seasonStandings,
    ) {}

    public function __invoke(Season $season): SeasonDigestData
    {
        $nights = $season->nights()->finished()->scoring()->orderBy('starts_at')->orderBy('id')->get(['id', 'is_extra']);
        $results = NightResult::query()->whereIn('night_id', $nights->pluck('id'))->get(['night_id', 'player_id', 'points', 'position'])->groupBy('night_id');
        $totals = $this->seasonStandings->totalsLines($season);

        $lines = fn (iterable $ids) => collect($ids)->flatMap(fn (int $id) => ($results[$id] ?? collect())->map(
            fn (NightResult $line) => new ScoreLine($line->player_id, Money::fromDecimal((string) $line->points), $line->position),
        ))->all();
        $ids = $nights->pluck('id')->all();
        $latestId = $ids === [] ? null : $ids[count($ids) - 1];

        $digest = $this->digest->lines(
            $this->standings->rank([...$lines($ids), ...$totals]),
            $this->standings->rank([...$lines(array_slice($ids, 0, -1)), ...$totals]),
            array_map(fn (int $id) => ($results[$id] ?? collect())->pluck('position', 'player_id')->map(fn ($p) => (int) $p)->all(), $ids),
            $latestId === null ? [] : ($results[$latestId] ?? collect())->mapWithKeys(fn (NightResult $line) => [$line->player_id => Money::fromDecimal((string) $line->points)])->all(),
        );
        $players = Player::query()->findMany(array_map(fn ($line) => $line->row->playerId, $digest))->keyBy('id');

        return new SeasonDigestData(
            $season,
            roundsPlayed: $nights->where('is_extra', false)->count(),
            extraNightsPlayed: $nights->where('is_extra', true)->count(),
            latestNight: $latestId === null ? null : Night::query()->with(['place', 'results.player'])->find($latestId),
            nextNight: $season->nights()->notArchived()->where('status', '!=', 'finished')->with('place')->orderBy('starts_at')->first(),
            lines: array_map(fn ($line) => new SeasonDigestEntry($line, $players[$line->row->playerId]), $digest),
            recaps: $season->recaps()->published()->with(['night', 'author'])->newestFirst()->limit(self::RECAPS)->get()->all(),
        );
    }
}
