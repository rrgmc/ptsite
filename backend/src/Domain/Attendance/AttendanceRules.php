<?php

namespace PTSite\Domain\Attendance;

use PTSite\Domain\Nights\NightStatus;
use PTSite\Domain\Shared\RuleViolation;

/**
 * When answers are taken, and what an answer change means (docs/specs/attendance.md).
 */
final class AttendanceRules
{
    /** Only an open night takes answers: a scheduled one not yet, a finished or archived one no longer. */
    public function assertOpenForAnswers(NightStatus $status, bool $archived): void
    {
        if ($archived || $status === NightStatus::Finished) {
            throw new RuleViolation('attendance.closed');
        }
        if ($status === NightStatus::Scheduled) {
            throw new RuleViolation('attendance.not_open');
        }
    }

    /**
     * Whether saving $new over $current changes anything. Repeating the same answer does not, so the player
     * keeps their place (and answer time) in the list.
     */
    public function changes(?AttendanceAnswer $current, ?AttendanceAnswer $new): bool
    {
        return $current !== $new;
    }
}
