<?php

namespace PTSite\Domain\Nights;

use PTSite\Domain\Shared\RuleViolation;

/**
 * When a night has a dashboard, and what cannot be undone on it (docs/specs/night-dashboard.md).
 */
final class NightDashboardRules
{
    /** A regular night has a dashboard once it is open, and keeps it when finished. A cancelled one has none. */
    public function assertHasDashboard(NightStatus $status, NightType $type, bool $archived): void
    {
        if ($type !== NightType::Regular) {
            throw new RuleViolation('night.dashboard.main_event_night');
        }
        if ($archived || $status === NightStatus::Scheduled) {
            throw new RuleViolation('night.dashboard.not_open');
        }
    }

    /** The positions and the Main Event pot belong to the partial result, which only an open night has. */
    public function assertTakesPartialResult(NightStatus $status): void
    {
        if ($status !== NightStatus::Open) {
            throw new RuleViolation('night.dashboard.finished');
        }
    }

    /** A participant leaves the night (FOLD, no answer, or removed) only while nothing was recorded for them. */
    public function assertCanLeave(?NightEntry $entry): void
    {
        if ($entry?->hasPayments()) {
            throw new RuleViolation('night.money.has_payments');
        }
    }
}
