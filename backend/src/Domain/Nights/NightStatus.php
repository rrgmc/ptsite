<?php

namespace PTSite\Domain\Nights;

enum NightStatus: string
{
    case Scheduled = 'scheduled';
    case Open = 'open';
    case Finished = 'finished';
}
