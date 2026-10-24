<?php

namespace PTSite\Domain\Recaps;

/** What one player bought, added up over some nights: for the jokes of a recap about rebuys and the time chip. */
final readonly class PlayerMoneyLine
{
    public function __construct(
        public int $playerId,
        /** Every rebuy, past the limit included. */
        public int $rebuys = 0,
        /** The rebuys past the limit of their night: they put money in the pot, but the player plays only for money. */
        public int $moneyOnlyRebuys = 0,
        /** The nights the player arrived late and owed a time chip. */
        public int $lateArrivals = 0,
        /** The time chips the player paid: one for each late arrival, and one for each rebuy on a night whose rebuy charges one. */
        public int $timeChips = 0,
    ) {}

    public function plus(self $other): self
    {
        return new self($this->playerId, $this->rebuys + $other->rebuys, $this->moneyOnlyRebuys + $other->moneyOnlyRebuys,
            $this->lateArrivals + $other->lateArrivals, $this->timeChips + $other->timeChips);
    }
}
