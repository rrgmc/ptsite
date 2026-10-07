<?php

namespace PTSite\Domain\Nights;

use DateTimeImmutable;

final readonly class NightSuggestion
{
    public function __construct(public DateTimeImmutable $startsAt) {}
}
