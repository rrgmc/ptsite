<?php

namespace PTSite\App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use PTSite\App\Queries\SeasonDigestData;
use PTSite\App\Queries\SeasonDigestEntry;
use PTSite\App\Queries\SeasonDigestMoney;
use PTSite\Domain\Recaps\PlayerMoneyLine;

/** @mixin SeasonDigestData */
class SeasonDigestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'season' => [
                'id' => $this->season->id,
                'name' => $this->season->name,
                'starts_on' => $this->season->starts_on->toDateString(),
                'is_finished' => $this->season->is_finished,
                /** The regular nights the season plans. */
                'rounds' => $this->season->rounds,
                /** Finished regular nights. */
                'rounds_played' => $this->roundsPlayed,
                /** @var int */
                'rounds_left' => max(0, $this->season->rounds - $this->roundsPlayed),
                'extra_nights_played' => $this->extraNightsPlayed,
                /** The time chips of the season's finished nights: the money for the year party. Null on a site with no time chip. */
                'time_chip_total' => $this->timeChipTotal?->toDecimal(),
            ],
            /** The latest finished night that gives points, with its results; null before the first one. */
            'latest_night' => $this->latestNight === null ? null : new NightResource($this->latestNight),
            /** The next night that is not finished yet: scheduled or open. */
            'next_night' => $this->nextNight === null ? null : new NightResource($this->nextNight),
            /**
             * The standings, with how they moved on the latest night.
             *
             * @var list<array{rank: int, previous_rank: int|null, player: PlayerResource, points: string, points_on_latest_night: string, gap_to_leader: string, gap_to_above: string, nights_scored: int, wins: int, form: list<int|null>}>
             */
            'standings' => array_map(fn (SeasonDigestEntry $entry) => [
                'rank' => $entry->line->row->rank,
                /** The rank before the latest night; null when the player had not scored yet. */
                'previous_rank' => $entry->line->previousRank,
                'player' => new PlayerResource($entry->player),
                'points' => $entry->line->row->points->toDecimal(),
                'points_on_latest_night' => $entry->line->pointsOnLatestNight->toDecimal(),
                'gap_to_leader' => $entry->line->gapToLeader->toDecimal(),
                'gap_to_above' => $entry->line->gapToAbove->toDecimal(),
                'nights_scored' => $entry->line->row->nightsScored,
                'wins' => $entry->line->row->wins,
                /** The player's position on each of the latest five nights, oldest first; null where they did not score. */
                'form' => $entry->line->form,
            ], $this->lines),
            /**
             * What the night dashboard recorded, for every player who rebought or arrived late: over the season's
             * finished nights, and on the latest one. The most time chips first. Rebuys past the limit
             * (money_only_rebuys) put money in the pot, but the player plays only for money. Null on a site with
             * no night dashboard.
             *
             * @var list<array{player: PlayerResource, season: array{rebuys: int, money_only_rebuys: int, late_arrivals: int, time_chips: int}, latest_night: array{rebuys: int, money_only_rebuys: int, late_arrivals: int, time_chips: int}}>|null
             */
            'money' => $this->money === null ? null : array_map(fn (SeasonDigestMoney $m) => [
                'player' => new PlayerResource($m->player),
                'season' => self::moneyLine($m->season),
                'latest_night' => self::moneyLine($m->latest),
            ], $this->money),
            /** The latest published recaps, newest first. */
            'recaps' => SeasonRecapResource::collection($this->recaps),
        ];
    }

    /** @return array{rebuys: int, money_only_rebuys: int, late_arrivals: int, time_chips: int} */
    private static function moneyLine(PlayerMoneyLine $line): array
    {
        return ['rebuys' => $line->rebuys, 'money_only_rebuys' => $line->moneyOnlyRebuys, 'late_arrivals' => $line->lateArrivals, 'time_chips' => $line->timeChips];
    }
}
