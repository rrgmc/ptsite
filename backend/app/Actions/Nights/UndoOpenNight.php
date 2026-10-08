<?php

namespace PTSite\App\Actions\Nights;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use PTSite\App\Models\Night;
use PTSite\App\Models\User;
use PTSite\App\Support\AuditLogger;
use PTSite\Domain\Nights\NightRules;
use PTSite\Domain\Nights\NightStatus;

/**
 * "Desfazer abertura": makes a night that was opened by mistake scheduled again. What was recorded while it was
 * open is deleted: the partial result and the night dashboard's records. The attendance answers stay.
 */
final class UndoOpenNight
{
    public function __construct(
        private readonly NightRules $rules,
        private readonly AuditLogger $audit,
    ) {}

    public function __invoke(User $user, Night $night): Night
    {
        Gate::forUser($user)->authorize('undoOpen', $night);
        $this->rules->assertCanUndoOpen(NightStatus::from($night->status));

        return DB::transaction(function () use ($user, $night) {
            $before = [...NightSnapshot::of($night), ...$this->recorded($night)];

            $night->partialResult()->delete();
            $night->rebuys()->delete();
            $night->entries()->delete();
            $night->prices()->delete();
            $night->forceFill(['status' => NightStatus::Scheduled->value, 'house_owner_player_id' => null])->save();
            $night->unsetRelations();

            $this->audit->record($user, 'night.open_undone', $night, $before, NightSnapshot::of($night));

            return $night;
        });
    }

    /**
     * What the open night has on record, for the audit log: nothing else keeps it once it is deleted.
     *
     * @return array<string, mixed>
     */
    private function recorded(Night $night): array
    {
        $partial = $night->partialResult()->with('positions')->first();

        return [
            'house_owner_player_id' => $night->house_owner_player_id,
            'partial_result' => $partial === null ? null : [
                'pot' => $partial->pot,
                'main_event_pot' => $partial->main_event_pot,
                'time_chip' => $partial->time_chip,
                'positions' => $partial->positions->map(fn ($line) => ['position' => $line->position, 'player_id' => $line->player_id])->values()->all(),
            ],
            'dashboard_players' => $night->entries()->orderBy('player_id')->get()
                ->map(fn ($entry) => ['player_id' => $entry->player_id, 'buy_in_paid' => $entry->buy_in_paid_at !== null, 'time_chip' => $entry->time_chip_at !== null, 'time_chip_paid' => $entry->time_chip_paid_at !== null])
                ->all(),
            'dashboard_rebuys' => $night->rebuys()->get()
                ->map(fn ($rebuy) => ['player_id' => $rebuy->player_id, 'paid' => $rebuy->paid_at !== null])
                ->all(),
        ];
    }
}
