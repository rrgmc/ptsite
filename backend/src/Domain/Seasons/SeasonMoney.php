<?php

namespace PTSite\Domain\Seasons;

use PTSite\Domain\Shared\Money;
use PTSite\Domain\Shared\RuleViolation;

/**
 * What a night of a season costs: the buy-in, the rebuy and the time chip, how many rebuys a player can make,
 * the smaller buy-in of the owner of the house, and the share of the pot that goes to the Main Event. On a site
 * with the night dashboard, a night's money is worked out from them (NightMoney).
 */
final readonly class SeasonMoney
{
    /** The most rebuys a season can allow. */
    public const MAX_REBUYS = 20;

    /**
     * @param  ?Money  $rebuyValue  a rebuy's price, without the time chip it may also charge
     * @param  int  $rebuysAllowed  how many rebuys a player can make on a night; 0 means none
     * @param  bool  $allowsExtraRebuys  rebuys past the allowed number, which do not count for the season's points
     * @param  ?int  $mainEventPotPercent  the share of a night's pot suggested as its Main Event pot, from 0 to 100
     */
    private function __construct(
        public ?Money $buyIn,
        public ?Money $rebuyValue,
        public ?Money $timeChipValue,
        public int $rebuysAllowed,
        public bool $rebuyChargesTimeChip,
        public bool $allowsExtraRebuys,
        public ?Money $houseOwnerBuyIn,
        public ?int $mainEventPotPercent,
    ) {}

    public static function of(
        ?Money $buyIn = null,
        ?Money $rebuyValue = null,
        ?Money $timeChipValue = null,
        int $rebuysAllowed = 0,
        bool $rebuyChargesTimeChip = false,
        bool $allowsExtraRebuys = false,
        ?Money $houseOwnerBuyIn = null,
        ?int $mainEventPotPercent = null,
    ): self {
        if ($rebuysAllowed < 0 || $rebuysAllowed > self::MAX_REBUYS) {
            throw new RuleViolation('season.money.rebuys_allowed', 'rebuys_allowed', ['max' => self::MAX_REBUYS]);
        }
        if ($mainEventPotPercent !== null && ($mainEventPotPercent < 0 || $mainEventPotPercent > 100)) {
            throw new RuleViolation('season.money.main_event_pot_percent', 'main_event_pot_percent');
        }
        $money = new self($buyIn, $rebuyValue, $timeChipValue, $rebuysAllowed, $rebuyChargesTimeChip, $allowsExtraRebuys, $houseOwnerBuyIn, $mainEventPotPercent);
        if ($money->hasRebuys() && $rebuyValue === null) {
            throw new RuleViolation('season.money.rebuy_value_required', 'rebuy_value');
        }
        if ($houseOwnerBuyIn !== null && $buyIn === null) {
            throw new RuleViolation('season.money.house_owner_without_buy_in', 'house_owner_buy_in');
        }
        if ($houseOwnerBuyIn !== null && $houseOwnerBuyIn->compare($buyIn) > 0) {
            throw new RuleViolation('season.money.house_owner_above_buy_in', 'house_owner_buy_in');
        }

        return $money;
    }

    /** Whether a player can rebuy at all: within the allowed number, or past it without points. */
    public function hasRebuys(): bool
    {
        return $this->rebuysAllowed > 0 || $this->allowsExtraRebuys;
    }
}
