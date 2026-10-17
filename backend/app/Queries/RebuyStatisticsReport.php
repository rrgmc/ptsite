<?php

namespace PTSite\App\Queries;

/** The rebuys and time chips the night dashboard recorded, ready to show. See docs/specs/statistics.md. */
final readonly class RebuyStatisticsReport
{
    public function __construct(
        public int $rebuyCount,
        public RankedList $rebuys,
        /** The rebuys past the limit. */
        public int $moneyOnlyRebuyCount,
        public RankedList $moneyOnlyRebuys,
        /** The time chips of late players. Null on a site with no time chip, as the list after it. */
        public ?int $timeChipCount,
        public ?RankedList $timeChips,
        /** @var list<int> the rebuys of each step of the points progress: of a night, or of a season's nights */
        public array $rebuysPerStep,
        /** @var list<int>|null the time chips of late players of each step, as the rebuys. Null on a site with no time chip. */
        public ?array $timeChipsPerStep,
    ) {}
}
