<?php

namespace PTSite\App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use PTSite\App\Queries\SeasonDigestData;
use PTSite\App\Queries\SeasonDigestEntry;

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
            /** The latest published recaps, newest first. */
            'recaps' => SeasonRecapResource::collection($this->recaps),
        ];
    }
}
