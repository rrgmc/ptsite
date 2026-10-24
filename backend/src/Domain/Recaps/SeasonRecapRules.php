<?php

namespace PTSite\Domain\Recaps;

use PTSite\Domain\Shared\RuleViolation;

/** Rules for the season recaps (docs/specs/season-recaps.md). */
final class SeasonRecapRules
{
    /** A recap is published only on a site that shows recaps. A draft can be written either way. */
    public function assertCanPublish(bool $featureEnabled): void
    {
        if (! $featureEnabled) {
            throw new RuleViolation('recap.disabled', 'published');
        }
    }

    /** A recap may be about one night: a finished night of the same season, with no other recap. */
    public function assertNightFits(bool $sameSeason, bool $finished, bool $hasOtherRecap): void
    {
        if (! $sameSeason) {
            throw new RuleViolation('recap.night_other_season', 'night_id');
        }
        if (! $finished) {
            throw new RuleViolation('recap.night_not_finished', 'night_id');
        }
        if ($hasOtherRecap) {
            throw new RuleViolation('recap.night_taken', 'night_id');
        }
    }
}
