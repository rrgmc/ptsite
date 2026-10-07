<?php

namespace PTSite\Domain\Attendance;

/** A player's answer for a night: coming ("ALL IN") or not ("FOLD"). */
enum AttendanceAnswer: string
{
    case AllIn = 'all_in';
    case Fold = 'fold';
}
