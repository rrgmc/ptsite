<?php

namespace PTSite\App\Queries;

use Illuminate\Support\Collection;
use PTSite\App\Models\Night;
use PTSite\App\Models\NightResult;
use PTSite\App\Models\Season;
use PTSite\Domain\Shared\Money;
use PTSite\Domain\Standings\ScoreLine;
use PTSite\Domain\Statistics\NightRecord;

/**
 * The nights the statistics count: the finished, non-archived nights of one season, or of every season that is
 * not archived. A Main Event night has no pot and no points, so it is left out; an extra night is counted.
 */
final class FinishedNights
{
    /** @return Collection<int, Night> by night id, oldest first, with their results and season */
    public function __invoke(?Season $season): Collection
    {
        return Night::query()
            ->finished()
            ->scoring()
            ->when($season, fn ($q) => $q->where('season_id', $season->id), fn ($q) => $q->whereHas('season', fn ($s) => $s->notArchived()))
            ->with(['results', 'season:id,name'])
            ->orderBy('starts_at')
            ->orderBy('id')
            ->get()
            ->keyBy('id');
    }

    /**
     * @param  Collection<int, Night>  $nights
     * @return list<NightRecord>
     */
    public function records(Collection $nights): array
    {
        return $nights->map(fn (Night $night) => new NightRecord(
            $night->id,
            $night->season_id,
            Money::fromDecimal((string) $night->pot),
            Money::fromDecimal((string) ($night->main_event_pot ?? '0')),
            Money::fromDecimal((string) ($night->time_chip ?? '0')),
            $night->place_id,
            $night->results->map(fn (NightResult $line) => new ScoreLine($line->player_id, Money::fromDecimal((string) $line->points), $line->position))->all(),
        ))->values()->all();
    }

    /**
     * The steps of a points progress, ready to show.
     *
     * @param  list<int>  $ids  night ids, or season ids when there is one step per season
     * @param  Collection<int, Night>  $nights
     * @return list<array{night_id: ?int, starts_at: ?string, season_id: int, season_name: string}>
     */
    public function steps(array $ids, Collection $nights, bool $perSeason): array
    {
        if ($perSeason) {
            $names = $nights->pluck('season.name', 'season_id');

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
