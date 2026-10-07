<?php

namespace PTSite\App\Enums;

enum Role: string
{
    case Player = 'player';
    case ResultsKeeper = 'results_keeper';
    case Admin = 'admin';

    /** Results keepers and admins can run nights and enter results. */
    public function canRunNights(): bool
    {
        return $this === self::ResultsKeeper || $this === self::Admin;
    }
}
