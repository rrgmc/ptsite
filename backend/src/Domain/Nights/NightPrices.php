<?php

namespace PTSite\Domain\Nights;

use PTSite\Domain\Features\Feature;
use PTSite\Domain\Features\Features;
use PTSite\Domain\Seasons\SeasonMoney;
use PTSite\Domain\Shared\Money;

/**
 * What a night charges, ready to calculate with: a season's money settings, on this site. A price the season
 * does not have is zero, and so is the price of a feature the site does not have
 * (docs/specs/night-dashboard.md, rule 8).
 */
final readonly class NightPrices
{
    /** The most rebuys one player can have on a night, whatever the season allows past its limit. */
    public const MAX_REBUYS_PER_PLAYER = 50;

    /**
     * @param  Money  $houseOwnerBuyIn  the buy-in when no smaller one applies to the owner of the house
     * @param  ?int  $mainEventPotPercent  null when the season sets none, or the site has no Main Event pot
     */
    private function __construct(
        public Money $buyIn,
        public Money $houseOwnerBuyIn,
        public Money $rebuyValue,
        public Money $timeChipValue,
        public int $rebuysAllowed,
        public bool $allowsExtraRebuys,
        public bool $rebuyChargesTimeChip,
        public ?int $mainEventPotPercent,
    ) {}

    public static function of(SeasonMoney $money, Features $features = new Features): self
    {
        $timeChip = $features->enabled(Feature::TimeChip);
        $buyIn = $money->buyIn ?? Money::zero();

        return new self(
            $buyIn,
            $features->enabled(Feature::HouseOwnerBuyIn) ? ($money->houseOwnerBuyIn ?? $buyIn) : $buyIn,
            $money->rebuyValue ?? Money::zero(),
            $timeChip ? ($money->timeChipValue ?? Money::zero()) : Money::zero(),
            $money->rebuysAllowed,
            $money->allowsExtraRebuys,
            $timeChip && $money->rebuyChargesTimeChip,
            $features->enabled(Feature::MainEventPot) ? $money->mainEventPotPercent : null,
        );
    }

    /** What one rebuy adds to the time chip. */
    public function timeChipOfRebuy(): Money
    {
        return $this->rebuyChargesTimeChip ? $this->timeChipValue : Money::zero();
    }
}
