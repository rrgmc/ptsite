<?php

namespace PTSite\App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A change to the holiday table for one year: a cancelled holiday (holiday_id) or an extra one (date and name). */
#[Fillable(['year', 'holiday_id', 'date', 'name'])]
class HolidayException extends Model
{
    protected function casts(): array
    {
        return ['year' => 'integer', 'date' => 'date'];
    }

    /** @return BelongsTo<Holiday, $this> */
    public function holiday(): BelongsTo
    {
        return $this->belongsTo(Holiday::class);
    }
}
