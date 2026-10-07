<?php

namespace PTSite\App\Http\Requests;

/** Same fields as creating, all optional: only the fields sent are changed. */
class UpdateHolidayRequest extends SaveHolidayRequest
{
    protected function creating(): bool
    {
        return false;
    }
}
