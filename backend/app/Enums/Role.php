<?php

namespace PTSite\App\Enums;

enum Role: string
{
    case Player = 'player';
    case ResultsKeeper = 'results_keeper';
    case Admin = 'admin';
    /** An account with no player, for a program that writes texts through the API: the memos and the season recaps. */
    case Writer = 'writer';

    /** Results keepers and admins can run nights and enter results. */
    public function canRunNights(): bool
    {
        return $this === self::ResultsKeeper || $this === self::Admin;
    }

    /** Writers and admins write the players' memos and the season recaps. */
    public function canWriteTexts(): bool
    {
        return $this === self::Writer || $this === self::Admin;
    }
}
