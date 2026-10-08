<?php

namespace PTSite\App\Queries;

use Illuminate\Support\Facades\Gate;
use PTSite\App\Models\Night;
use PTSite\App\Models\NightRebuy;
use PTSite\App\Models\Player;
use PTSite\App\Models\User;
use PTSite\App\Support\NightLedger;
use PTSite\Domain\Features\Feature;
use PTSite\Domain\Features\Features;
use PTSite\Domain\Nights\MoneyTotal;
use PTSite\Domain\Nights\NightDashboardRules;
use PTSite\Domain\Nights\NightEntry;
use PTSite\Domain\Nights\NightMoney;
use PTSite\Domain\Nights\NightStatus;
use PTSite\Domain\Nights\NightType;
use PTSite\Domain\Shared\Money;

/**
 * A night's dashboard ("Painel do evento", docs/specs/night-dashboard.md): its participants with what they bought
 * and paid, the amounts worked out from it, and the open night's partial result. Nothing here is stored as a
 * total: every amount is calculated from the records on each request.
 */
final class NightDashboard
{
    public function __construct(
        private readonly NightDashboardRules $rules,
        private readonly NightLedger $ledger,
        private readonly Features $features,
    ) {}

    public function __invoke(User $user, Night $night): NightDashboardReport
    {
        $this->rules->assertHasDashboard(NightStatus::from($night->status), NightType::from($night->type ?? 'regular'), $night->isArchived());

        $prices = $this->ledger->prices($night);
        $money = new NightMoney($prices);
        $rebuys = $this->ledger->rebuysByPlayer($night);
        $entries = $this->ledger->entries($night, $rebuys);
        $players = Player::query()->findMany(array_keys($entries))->keyBy('id');

        $lines = SortByName::sort(collect($entries), fn (NightEntry $entry) => $players[$entry->playerId]->nickname)
            ->map(function (NightEntry $entry) use ($money, $players, $rebuys) {
                $owes = $money->potOf($entry)->plus($money->timeChipOf($entry));

                return [
                    'player' => $players[$entry->playerId],
                    'is_house_owner' => $entry->isHouseOwner,
                    'buy_in' => $money->buyInOf($entry)->toDecimal(),
                    'buy_in_paid' => $entry->buyInPaid,
                    'time_chip' => $entry->timeChip,
                    'time_chip_paid' => $entry->timeChipPaid,
                    'rebuys' => ($rebuys[$entry->playerId] ?? collect())
                        ->map(fn (NightRebuy $rebuy) => ['id' => $rebuy->id, 'paid' => $rebuy->paid_at !== null])->values()->all(),
                    ...$this->amounts($owes),
                ];
            })->all();

        $pot = $money->pot($entries);
        $timeChip = $money->timeChip($entries);
        $open = $night->status === NightStatus::Open->value;
        $partial = $open ? $night->partialResult()->with('positions.player')->first() : null;
        // A pot typed by hand stands in for the one worked out, also for the Main Event pot it suggests.
        $manualPot = $partial?->pot;
        $potInUse = $manualPot === null ? $pot->owed : Money::fromDecimal((string) $manualPot);

        return new NightDashboardReport(
            nightId: $night->id,
            status: $night->status,
            canEdit: Gate::forUser($user)->allows('manageDashboard', $night),
            prices: [
                'buy_in' => $prices->buyIn->toDecimal(),
                'house_owner_buy_in' => $prices->houseOwnerBuyIn->toDecimal(),
                'rebuy_value' => $prices->rebuyValue->toDecimal(),
                'time_chip_value' => $prices->timeChipValue->toDecimal(),
                'rebuys_allowed' => $prices->rebuysAllowed,
                'allows_extra_rebuys' => $prices->allowsExtraRebuys,
                'rebuy_charges_time_chip' => $prices->rebuyChargesTimeChip,
                'fixed' => $night->prices !== null,
            ],
            houseOwner: $night->houseOwner,
            players: $lines,
            positions: ($partial?->positions ?? collect())->map(fn ($line) => ['position' => $line->position, 'player' => $line->player])->values()->all(),
            mainEventPot: $partial?->main_event_pot,
            suggestedMainEventPot: $open ? $money->suggestedMainEventPot($potInUse)?->toDecimal() : null,
            pot: $this->amounts($pot),
            timeChip: $this->features->enabled(Feature::TimeChip) ? $this->amounts($timeChip) : null,
            total: $this->amounts($pot->plus($timeChip)),
            manual: ['pot' => $manualPot, 'time_chip' => $this->features->enabled(Feature::TimeChip) ? $partial?->time_chip : null],
            recorded: $open ? null : ['pot' => $night->pot, 'main_event_pot' => $night->main_event_pot, 'time_chip' => $night->time_chip],
            readAt: now()->toIso8601String(),
        );
    }

    /** @return array{owed: string, paid: string, pending: string} */
    private function amounts(MoneyTotal $total): array
    {
        return ['owed' => $total->owed->toDecimal(), 'paid' => $total->paid->toDecimal(), 'pending' => $total->pending()->toDecimal()];
    }
}
