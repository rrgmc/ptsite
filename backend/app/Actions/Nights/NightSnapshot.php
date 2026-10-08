<?php

namespace PTSite\App\Actions\Nights;

use PTSite\App\Models\Night;

/** The parts of a night the audit log records before and after a change. */
final class NightSnapshot
{
    /** @return array<string, mixed> */
    public static function of(Night $night): array
    {
        $night->loadMissing(['results', 'mainEventPositions']);

        return [
            'status' => $night->status,
            'type' => $night->type ?? 'regular',
            'is_extra' => (bool) $night->is_extra,
            'starts_at' => $night->starts_at?->toIso8601String(),
            'place_id' => $night->place_id,
            'description' => $night->description,
            'archived_at' => $night->archived_at?->toIso8601String(),
            'pot' => $night->pot,
            'main_event_pot' => $night->main_event_pot,
            'time_chip' => $night->time_chip,
            'results' => $night->results
                ->map(fn ($line) => ['position' => $line->position, 'player_id' => $line->player_id, 'points' => $line->points])
                ->values()->all(),
            // A Main Event's result: its players, the 1st place first.
            'main_event_player_ids' => $night->mainEventPositions->pluck('player_id')->all(),
        ];
    }
}
