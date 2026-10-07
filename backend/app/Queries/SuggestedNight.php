<?php

namespace PTSite\App\Queries;

final readonly class SuggestedNight
{
    public function __construct(
        /** ISO 8601 date and time with offset. */
        public string $startsAt,
    ) {}
}
