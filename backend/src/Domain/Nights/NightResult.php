<?php

namespace PTSite\Domain\Nights;

use PTSite\Domain\Shared\Money;

/**
 * What is entered when a night is finished: the pot, the Main Event pot, the time chip and who finished in each
 * scoring position. Only the pot counts for points. The Main Event pot and the time chip are null on a site that
 * does not have them (PTSite\Domain\Features\Feature).
 */
final readonly class NightResult
{
    /** @param array<int, int> $playerByPosition position => player id */
    public function __construct(
        public Money $pot,
        public ?Money $mainEventPot,
        public ?Money $timeChip,
        public array $playerByPosition,
    ) {}
}
