<?php

namespace PTSite\Domain\Nights;

/** What a night's result is. */
enum NightType: string
{
    /** A pot shared by the scoring positions, as points. */
    case Regular = 'regular';

    /** The order of its players, with no pot and no points. A season has at most one, and it is always extra. */
    case MainEvent = 'main_event';
}
