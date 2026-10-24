<?php

namespace PTSite\App\Queries;

use Illuminate\Support\Collection;
use PTSite\App\Models\Night;
use PTSite\App\Models\NightResult;
use PTSite\App\Models\Player;
use PTSite\App\Models\Season;
use PTSite\Domain\Features\Feature;
use PTSite\Domain\Features\Features;
use PTSite\Domain\Recaps\MoneyTally;
use PTSite\Domain\Recaps\PlayerMoneyLine;
use PTSite\Domain\Shared\Money;
use PTSite\Domain\Standings\ScoreLine;
use PTSite\Domain\Standings\Standings;
use PTSite\Domain\Standings\StandingsDigest;

/**
 * Everything a recap of the season needs, in one read (docs/specs/season-recaps.md, "Digest"): the standings and
 * how they moved on the latest night, that night, the next one, how many rounds are left, the rebuys and time
 * chips, and the latest recaps.
 */
final class SeasonDigest
{
    public const int RECAPS = 3;

    public function __construct(
        private readonly Standings $standings,
        private readonly StandingsDigest $digest,
        private readonly SeasonStandings $seasonStandings,
        private readonly MoneyTally $tally,
        private readonly Features $features,
    ) {}

    public function __invoke(Season $season): SeasonDigestData
    {
        $nights = $season->nights()->finished()->scoring()->orderBy('starts_at')->orderBy('id')->get(['id', 'is_extra', 'time_chip']);
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
        $money = $this->features->enabled(Feature::NightDashboard) ? $this->money($season, $ids, $latestId) : null;
        $players = Player::query()->findMany([
            ...array_map(fn ($line) => $line->row->playerId, $digest),
            ...array_keys($money['season'] ?? []),
        ])->keyBy('id');
        $timeChip = $this->features->enabled(Feature::TimeChip);

        return new SeasonDigestData(
            $season,
            roundsPlayed: $nights->where('is_extra', false)->count(),
            extraNightsPlayed: $nights->where('is_extra', true)->count(),
            latestNight: $latestId === null ? null : Night::query()->with(['place', 'results.player'])->find($latestId),
            nextNight: $season->nights()->notArchived()->where('status', '!=', 'finished')->with('place')->orderBy('starts_at')->first(),
            lines: array_map(fn ($line) => new SeasonDigestEntry($line, $players[$line->row->playerId]), $digest),
            recaps: $season->recaps()->published()->with(['night', 'author'])->newestFirst()->limit(self::RECAPS)->get()->all(),
            timeChipTotal: $timeChip ? $nights->reduce(fn (Money $sum, Night $n) => $sum->plus(Money::fromDecimal((string) ($n->time_chip ?? '0'))), Money::zero()) : null,
            money: $money === null ? null : array_map(
                fn (PlayerMoneyLine $line) => new SeasonDigestMoney($players[$line->playerId], $line, $money['latest'][$line->playerId] ?? new PlayerMoneyLine($line->playerId)),
                array_values($this->mostFirst($money['season'])),
            ),
        );
    }

    /**
     * Each player's rebuys and time chips over the season's finished nights, and on the latest one.
     *
     * @param  list<int>  $ids
     * @return array{season: array<int, PlayerMoneyLine>, latest: array<int, PlayerMoneyLine>}
     */
    private function money(Season $season, array $ids, ?int $latestId): array
    {
        $timeChip = $this->features->enabled(Feature::TimeChip);
        /** @var Collection<int, Night> $nights */
        $nights = Night::query()->whereIn('id', $ids)->with(['rebuys:id,night_id,player_id', 'entries:id,night_id,player_id,time_chip_at', 'prices'])->get()->keyBy('id');
        $byNight = [];
        foreach ($ids as $id) {
            $night = $nights[$id];
            // The prices the night was finished with, or else its season's.
            $prices = $night->prices ?? $season;
            $byNight[$id] = $this->tally->night(
                $night->rebuys->countBy('player_id')->all(),
                $night->entries->whereNotNull('time_chip_at')->pluck('player_id')->values()->all(),
                (int) $prices->rebuys_allowed,
                (bool) $prices->rebuy_charges_time_chip,
                $timeChip,
            );
        }

        return ['season' => $this->tally->add(array_values($byNight)), 'latest' => $latestId === null ? [] : $byNight[$latestId]];
    }

    /**
     * Who bought the most first: by time chips, then rebuys, then player id.
     *
     * @param  array<int, PlayerMoneyLine>  $lines
     * @return array<int, PlayerMoneyLine>
     */
    private function mostFirst(array $lines): array
    {
        uasort($lines, fn (PlayerMoneyLine $a, PlayerMoneyLine $b) => [$b->timeChips, $b->rebuys, $a->playerId] <=> [$a->timeChips, $a->rebuys, $b->playerId]);

        return $lines;
    }
}
