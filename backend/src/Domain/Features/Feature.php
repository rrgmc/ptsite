<?php

namespace PTSite\Domain\Features;

/**
 * A part of the site that a league can turn off in the "features" of its site.json (site/README.md). The value
 * is the name written there. The frontend has the same list in frontend/src/site/features.ts.
 *
 * To add one: docs/architecture/backend-layers.md, "Adding a feature flag".
 */
enum Feature: string
{
    /** "Pote ME": the money a night sets aside for the Main Event. */
    case MainEventPot = 'mainEventPot';

    /** "Time chip": the money a night sets aside for the year party. */
    case TimeChip = 'timeChip';

    /** "Planejar datas": the calendar that schedules a season's regular nights at once. */
    case SeasonPlanner = 'seasonPlanner';

    /** "Main Event": a night of its own type, finished with the order of its players and no points. */
    case MainEvent = 'mainEvent';

    /** A season's smaller buy-in for the owner of the house where the night is played. */
    case HouseOwnerBuyIn = 'houseOwnerBuyIn';

    /** Whether a site that does not name the feature has it. */
    public function default(): bool
    {
        return match ($this) {
            self::MainEvent, self::HouseOwnerBuyIn => false,
            default => true,
        };
    }
}
