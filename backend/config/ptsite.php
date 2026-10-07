<?php

// Settings of this site. Everything a league changes without touching the code is here or in .env.
return [

    // A line below the site name, in the mail signature. Empty: the name alone.
    'tagline' => env('PTSITE_TAGLINE', ''),

    'holidays' => [
        /*
         * The holidays a new database starts with: a name from PTSite\Domain\Calendar\HolidayPresets, or the
         * name of a class that implements PTSite\Domain\Calendar\HolidayPreset. Empty: the table starts empty.
         * Admins edit the table afterwards, so changing this later does not change an existing database.
         */
        'preset' => env('PTSITE_HOLIDAY_PRESET'),
    ],

];
