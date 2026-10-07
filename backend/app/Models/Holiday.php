<?php

namespace PTSite\App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use PTSite\App\Models\Concerns\Archivable;

/** A holiday in the table: a fixed day and month, or a number of days after Easter. */
#[Fillable(['name', 'scope', 'month', 'day', 'easter_offset', 'first_year', 'last_year'])]
class Holiday extends Model
{
    use Archivable;

    protected function casts(): array
    {
        return [
            'month' => 'integer',
            'day' => 'integer',
            'easter_offset' => 'integer',
            'first_year' => 'integer',
            'last_year' => 'integer',
            'archived_at' => 'datetime',
        ];
    }

    /** @return HasMany<HolidayException, $this> */
    public function exceptions(): HasMany
    {
        return $this->hasMany(HolidayException::class);
    }
}
