<?php

namespace PTSite\Domain\Calendar;

/** Where a holiday applies. All three kinds count as a day with no night. */
enum HolidayScope: string
{
    case National = 'national';
    case State = 'state';
    case City = 'city';
}
