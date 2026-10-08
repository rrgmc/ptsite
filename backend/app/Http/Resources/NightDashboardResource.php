<?php

namespace PTSite\App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use PTSite\App\Queries\NightDashboardReport;

/** @mixin NightDashboardReport */
class NightDashboardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'night_id' => $this->nightId,
            /** @var 'open'|'finished' */
            'status' => $this->status,
            /** Whether this user may change this night's dashboard. The API still checks every request. */
            'can_edit' => $this->canEdit,
            /**
             * What the night charges, as decimal strings: a price the season does not have is "0.00". `fixed`
             * says the prices were copied when the night was finished, so the season no longer changes them.
             *
             * @var array{buy_in: string, house_owner_buy_in: string, rebuy_value: string, time_chip_value: string, rebuys_allowed: int, allows_extra_rebuys: bool, rebuy_charges_time_chip: bool, fixed: bool}
             */
            'prices' => $this->prices,
            /** The owner of the house where the night is played. */
            'house_owner' => $this->houseOwner === null ? null : new PlayerResource($this->houseOwner),
            /**
             * The participants, by name. `buy_in` is the price that applies to the player. `owed`, `paid` and
             * `pending` add up the buy-in, the rebuys and the time chips of the player.
             *
             * @var list<array{player: PlayerResource, is_house_owner: bool, buy_in: string, buy_in_paid: bool, time_chip: bool, time_chip_paid: bool, rebuys: list<array{id: int, paid: bool}>, owed: string, paid: string, pending: string}>
             */
            'players' => array_map(fn (array $line) => [...$line, 'player' => new PlayerResource($line['player'])], $this->players),
            /**
             * The positions of the open night's partial result filled so far. Empty once the night is finished.
             *
             * @var list<array{position: int, player: PlayerResource}>
             */
            'positions' => array_map(fn (array $line) => ['position' => $line['position'], 'player' => new PlayerResource($line['player'])], $this->positions),
            /** The Main Event pot set by hand on the open night. Null: the suggested one is in use. */
            'main_event_pot' => $this->mainEventPot,
            /** The season's share of the pot (the typed one, when there is one), rounded to a whole unit. Null when the season sets none. */
            'suggested_main_event_pot' => $this->suggestedMainEventPot,
            /** The amounts worked out from the participants. `time_chip` is null on a site without the time chip. */
            'totals' => [
                /** @var array{owed: string, paid: string, pending: string} */
                'pot' => $this->pot,
                /** @var array{owed: string, paid: string, pending: string}|null */
                'time_chip' => $this->timeChip,
                /** @var array{owed: string, paid: string, pending: string} */
                'total' => $this->total,
            ],
            /**
             * The pot and the time chip set by hand on an open night ("Manual"), which stand in
             * for the ones in `totals`. Null for an amount that was not typed.
             *
             * @var array{pot: string|null, time_chip: string|null}
             */
            'manual' => $this->manual,
            /**
             * The amounts a finished night was finished with. Null while the night is open.
             *
             * @var array{pot: string|null, main_event_pot: string|null, time_chip: string|null}|null
             */
            'recorded' => $this->recorded,
            /** When the server read this. */
            'read_at' => $this->readAt,
        ];
    }
}
