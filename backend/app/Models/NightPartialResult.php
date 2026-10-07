<?php

namespace PTSite\App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['night_id', 'pot', 'main_event_pot', 'time_chip', 'saved_by_user_id', 'saved_at'])]
class NightPartialResult extends Model
{
    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'pot' => 'decimal:2',
            'main_event_pot' => 'decimal:2',
            'time_chip' => 'decimal:2',
            'saved_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Night, $this> */
    public function night(): BelongsTo
    {
        return $this->belongsTo(Night::class);
    }

    /** @return HasMany<NightPartialResultPosition, $this> */
    public function positions(): HasMany
    {
        return $this->hasMany(NightPartialResultPosition::class, 'partial_result_id')->orderBy('position');
    }

    /** @return BelongsTo<User, $this> */
    public function savedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'saved_by_user_id');
    }
}
