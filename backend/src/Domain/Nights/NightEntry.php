<?php

namespace PTSite\Domain\Nights;

/**
 * One participant of a night, as the dashboard records them: what they bought and what they paid.
 */
final readonly class NightEntry
{
    /**
     * @param  bool  $timeChip  the player arrived late and owes a time chip
     * @param  list<bool>  $rebuysPaid  one item per rebuy, oldest first: whether it was paid
     */
    public function __construct(
        public int $playerId,
        public bool $isHouseOwner = false,
        public bool $buyInPaid = false,
        public bool $timeChip = false,
        public bool $timeChipPaid = false,
        public array $rebuysPaid = [],
    ) {}

    /** Whether anything was recorded beyond taking part: a mark or a rebuy. */
    public function hasPayments(): bool
    {
        return $this->buyInPaid || $this->timeChip || $this->timeChipPaid || $this->rebuysPaid !== [];
    }
}
