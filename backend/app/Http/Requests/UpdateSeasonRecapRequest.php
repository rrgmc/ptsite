<?php

namespace PTSite\App\Http\Requests;

/** Same fields as creating, all optional: only the fields sent are changed. */
class UpdateSeasonRecapRequest extends SaveSeasonRecapRequest
{
    protected function creating(): bool
    {
        return false;
    }
}
