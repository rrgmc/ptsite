<?php

namespace PTSite\App\Queries;

use Illuminate\Support\Collection;
use PTSite\App\Models\Night;
use PTSite\App\Models\NightResult;
use PTSite\App\Models\Season;
use PTSite\Domain\Features\Feature;
use PTSite\Domain\Features\Features;
use PTSite\Domain\Scoring\PercentageTable;
use PTSite\Domain\Shared\Money;
use PTSite\Domain\Standings\ScoreLine;
use PTSite\Domain\Statistics\MainEventAsNight;
use PTSite\Domain\Statistics\NightRecord;

/**
 * The nights the statistics count: the finished, non-archived nights of one season, or of every season that is
 * not archived. A Main Event night has no pot and no points, so it is left out; an extra night is counted. A season
 * known only by its final standings has no night: totalsSeasons() gives it, and records() puts it among the nights.
 */
final class FinishedNights
{
    public function __construct(
        private readonly Features $features,
        private readonly MainEventAsNight $mainEventAsNight = new MainEventAsNight,
    ) {}

    /** @return Collection<int, Night> by night id, oldest first, with their results and season */
    public function __invoke(?Season $season): Collection
    {
        return Night::query()
            ->finished()
            ->scoring()
            ->when($season, fn ($q) => $q->where('season_id', $season->id), fn ($q) => $q->whereHas('season', fn ($s) => $s->notArchived()))
            ->with(['results', 'season:id,name,rebuys_allowed,is_finished'])
            ->orderBy('starts_at')
            ->orderBy('id')
            ->get()
            ->keyBy('id');
    }

    /**
     * The seasons known only by their final standings, among the same seasons, oldest first, with their final lines.
     *
     * @return Collection<int, Season>
     */
    public function totalsSeasons(?Season $season): Collection
    {
        return Season::query()
            ->whereHas('totals')
            ->when($season, fn ($q) => $q->whereKey($season->id), fn ($q) => $q->notArchived())
            ->with('totals')
            ->orderBy('starts_on')
            ->orderBy('id')
            ->get();
    }

    /**
     * The finished Main Event nights of the same seasons, oldest first, with their players in order.
     *
     * @return Collection<int, Night>
     */
    public function mainEvents(?Season $season): Collection
    {
        return Night::query()
            ->finished()
            ->where('type', 'main_event')
            ->when($season, fn ($q) => $q->where('season_id', $season->id), fn ($q) => $q->whereHas('season', fn ($s) => $s->notArchived()))
            ->with('mainEventPositions')
            ->orderBy('starts_at')
            ->orderBy('id')
            ->get();
    }

    /**
     * The finished Main Events of the same seasons as records of one more night of their season, for the ranks by
     * season that count them, for fun ({@see MainEventAsNight}). A season with no night with a pot gives none.
     *
     * @param  list<NightRecord>  $records  the result of records()
     * @return list<NightRecord>
     */
    public function mainEventRecords(?Season $season, array $records): array
    {
        return $this->mainEvents($season)->load('season.percentages')
            ->map(fn (Night $night) => $this->mainEventAsNight->record(
                $night->id,
                $night->season_id,
                $records,
                $night->mainEventPositions->pluck('player_id')->all(),
                PercentageTable::of($night->season->percentByPosition()),
            ))
            ->filter()
            ->values()
            ->all();
    }

    /**
     * @param  Collection<int, Night>  $nights
     * @param  bool  $withDashboard  with the rebuys and the late players the night dashboard recorded
     * @param  ?Collection<int, Season>  $totalsSeasons  the result of totalsSeasons(): each is one record, placed
     *                                                   by its start date among the nights
     * @return list<NightRecord>
     */
    public function records(Collection $nights, bool $withDashboard = false, ?Collection $totalsSeasons = null): array
    {
        $records = $this->nightRecords($nights, $withDashboard);
        if ($totalsSeasons === null || $totalsSeasons->isEmpty()) {
            return $records;
        }

        $dated = [];
        foreach (array_values($nights->all()) as $index => $night) {
            $dated[] = [$night->starts_at->getTimestamp(), 1, $records[$index]];
        }
        foreach ($totalsSeasons as $season) {
            $lines = $season->totals->sortBy('player_id')->map(TotalsLines::of(...))->values()->all();
            $dated[] = [$season->starts_on->getTimestamp(), 0, NightRecord::seasonTotals($season->id, (int) $season->rounds, $lines)];
        }
        // Oldest first; a season starting the day of a night comes before it. usort keeps equal items in order.
        usort($dated, fn (array $a, array $b) => [$a[0], $a[1]] <=> [$b[0], $b[1]]);

        return array_map(fn (array $item) => $item[2], $dated);
    }

    /**
     * @param  Collection<int, Night>  $nights
     * @return list<NightRecord>
     */
    private function nightRecords(Collection $nights, bool $withDashboard): array
    {
        if ($withDashboard) {
            $nights->loadMissing(['rebuys', 'entries', 'prices']);
        }
        $timeChip = $this->features->enabled(Feature::TimeChip);

        return $nights->map(fn (Night $night) => new NightRecord(
            $night->id,
            $night->season_id,
            Money::fromDecimal((string) $night->pot),
            Money::fromDecimal((string) ($night->main_event_pot ?? '0')),
            Money::fromDecimal((string) ($night->time_chip ?? '0')),
            $night->place_id,
            $night->results->map(fn (NightResult $line) => new ScoreLine($line->player_id, Money::fromDecimal((string) $line->points), $line->position))->all(),
            ...($withDashboard ? [
                'rebuys' => $night->rebuys->countBy('player_id')->all(),
                // The prices the night was finished with, or else its season's.
                'rebuysAllowed' => (int) ($night->prices ?? $night->season)->rebuys_allowed,
                'timeChips' => $timeChip ? $night->entries->whereNotNull('time_chip_at')->pluck('player_id')->values()->all() : [],
            ] : []),
        ))->values()->all();
    }

    /**
     * The steps of a points progress, ready to show.
     *
     * @param  list<int>  $ids  night ids, or season ids when there is one step per season
     * @param  Collection<int, Night>  $nights
     * @param  ?Collection<int, Season>  $totalsSeasons  the seasons known only by their final standings among the steps
     * @return list<array{night_id: ?int, starts_at: ?string, season_id: int, season_name: string}>
     */
    public function steps(array $ids, Collection $nights, bool $perSeason, ?Collection $totalsSeasons = null): array
    {
        if ($perSeason) {
            $names = $nights->pluck('season.name', 'season_id')->union($totalsSeasons?->pluck('name', 'id') ?? []);

            return array_map(fn (int $id) => ['night_id' => null, 'starts_at' => null, 'season_id' => $id, 'season_name' => $names[$id]], $ids);
        }

        return array_map(fn (int $id) => [
            'night_id' => $id,
            'starts_at' => $nights[$id]->starts_at->toIso8601String(),
            'season_id' => $nights[$id]->season_id,
            'season_name' => $nights[$id]->season->name,
        ], $ids);
    }
}
