<?php

namespace PTSite\Domain\Calendar;

/** Why the season planner leaves out a regular night. */
enum SkipKind: string
{
    /** The night itself is a holiday. */
    case Holiday = 'holiday';
    /** The day before is a holiday ("emenda"): a long weekend. */
    case Bridge = 'bridge';
    /** The night falls in the Carnival weekend. */
    case Carnival = 'carnival';
}
