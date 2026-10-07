<?php

namespace PTSite\Domain\Calendar;

/** A ready-made list of holidays a new holiday table can start from. */
interface HolidayPreset
{
    /** @return list<HolidayRule> each with a stable slug as its key */
    public static function rules(): array;
}
