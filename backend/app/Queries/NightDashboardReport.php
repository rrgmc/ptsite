<?php

namespace PTSite\App\Queries;

use PTSite\App\Models\Player;

/**
 * A night's dashboard, ready to show. Amounts are decimal strings; an amount with three parts has what is owed,
 * what was paid and what is pending.
 */
final readonly class NightDashboardReport
{
    /**
     * @param  array{buy_in: string, house_owner_buy_in: string, rebuy_value: string, time_chip_value: string, rebuys_allowed: int, allows_extra_rebuys: bool, rebuy_charges_time_chip: bool, fixed: bool}  $prices
     * @param  list<array{player: Player, is_house_owner: bool, buy_in: string, buy_in_paid: bool, time_chip: bool, time_chip_paid: bool, rebuys: list<array{id: int, paid: bool}>, owed: string, paid: string, pending: string}>  $players
     * @param  list<array{position: int, player: Player}>  $positions
     * @param  array{owed: string, paid: string, pending: string}  $pot
     * @param  array{owed: string, paid: string, pending: string}|null  $timeChip  null on a site without the time chip
     * @param  array{owed: string, paid: string, pending: string}  $total
     * @param  array{pot: string|null, main_event_pot: string|null, time_chip: string|null}|null  $recorded
     */
    public function __construct(
        public int $nightId,
        public string $status,
        public bool $canEdit,
        public array $prices,
        public ?Player $houseOwner,
        public array $players,
        public array $positions,
        public ?string $mainEventPot,
        public ?string $suggestedMainEventPot,
        public array $pot,
        public ?array $timeChip,
        public array $total,
        public ?array $recorded,
        public string $readAt,
    ) {}
}
