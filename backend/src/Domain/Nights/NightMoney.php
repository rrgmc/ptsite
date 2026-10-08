<?php

namespace PTSite\Domain\Nights;

use PTSite\Domain\Shared\Money;
use PTSite\Domain\Shared\RuleViolation;

/**
 * A night's money, worked out from what its participants bought and paid (docs/specs/night-dashboard.md).
 * The pot is the buy-ins and every rebuy. The time chip is apart: one for each late player and, when the season
 * says so, one for each rebuy.
 */
final readonly class NightMoney
{
    public function __construct(private NightPrices $prices) {}

    /** The buy-in this participant owes: the smaller one for the owner of the house. */
    public function buyInOf(NightEntry $entry): Money
    {
        return $entry->isHouseOwner ? $this->prices->houseOwnerBuyIn : $this->prices->buyIn;
    }

    /** What one participant adds to the pot: the buy-in and the rebuys. */
    public function potOf(NightEntry $entry): MoneyTotal
    {
        $pot = MoneyTotal::zero()->with($this->buyInOf($entry), $entry->buyInPaid);
        foreach ($entry->rebuysPaid as $paid) {
            $pot = $pot->with($this->prices->rebuyValue, $paid);
        }

        return $pot;
    }

    /** What one participant adds to the time chip. A rebuy's time chip is paid with the rebuy. */
    public function timeChipOf(NightEntry $entry): MoneyTotal
    {
        $timeChip = MoneyTotal::zero();
        if ($entry->timeChip) {
            $timeChip = $timeChip->with($this->prices->timeChipValue, $entry->timeChipPaid);
        }
        foreach ($entry->rebuysPaid as $paid) {
            $timeChip = $timeChip->with($this->prices->timeChipOfRebuy(), $paid);
        }

        return $timeChip;
    }

    /** @param  iterable<NightEntry>  $entries */
    public function pot(iterable $entries): MoneyTotal
    {
        $pot = MoneyTotal::zero();
        foreach ($entries as $entry) {
            $pot = $pot->plus($this->potOf($entry));
        }

        return $pot;
    }

    /** @param  iterable<NightEntry>  $entries */
    public function timeChip(iterable $entries): MoneyTotal
    {
        $timeChip = MoneyTotal::zero();
        foreach ($entries as $entry) {
            $timeChip = $timeChip->plus($this->timeChipOf($entry));
        }

        return $timeChip;
    }

    /**
     * What one participant paid, but not in cash (rule 11a): a buy-in paid that way, with the time chip the player
     * paid, and each rebuy paid that way, with the time chip it pays.
     */
    public function nonCashOf(NightEntry $entry): Money
    {
        $nonCash = Money::zero();
        if ($entry->buyInPaid && $entry->buyInNonCash) {
            $nonCash = $nonCash->plus($this->buyInOf($entry));
            if ($entry->timeChip && $entry->timeChipPaid) {
                $nonCash = $nonCash->plus($this->prices->timeChipValue);
            }
        }
        foreach ($entry->rebuysPaid as $index => $paid) {
            if ($paid && ($entry->rebuysNonCash[$index] ?? false)) {
                $nonCash = $nonCash->plus($this->prices->rebuyValue)->plus($this->prices->timeChipOfRebuy());
            }
        }

        return $nonCash;
    }

    /** @param  iterable<NightEntry>  $entries */
    public function nonCash(iterable $entries): Money
    {
        $nonCash = Money::zero();
        foreach ($entries as $entry) {
            $nonCash = $nonCash->plus($this->nonCashOf($entry));
        }

        return $nonCash;
    }

    /**
     * The Main Event pot the season suggests for a pot: its share, rounded to a whole unit so the money is easy
     * to handle. Null when the season sets no share.
     */
    public function suggestedMainEventPot(Money $pot): ?Money
    {
        return $this->prices->mainEventPotPercent === null
            ? null
            : $pot->percent($this->prices->mainEventPotPercent)->roundedToUnit();
    }

    /**
     * A player can rebuy when the season has rebuys, and past its limit only when the season allows that.
     *
     * @param  int  $rebuys  how many the player already has
     */
    public function assertCanRebuy(int $rebuys): void
    {
        if ($this->prices->rebuysAllowed === 0 && ! $this->prices->allowsExtraRebuys) {
            throw new RuleViolation('night.money.no_rebuys');
        }
        if ($rebuys >= $this->prices->rebuysAllowed && ! $this->prices->allowsExtraRebuys) {
            throw new RuleViolation('night.money.rebuy_limit', null, ['max' => $this->prices->rebuysAllowed]);
        }
        if ($rebuys >= NightPrices::MAX_REBUYS_PER_PLAYER) {
            throw new RuleViolation('night.money.rebuy_limit', null, ['max' => NightPrices::MAX_REBUYS_PER_PLAYER]);
        }
    }
}
