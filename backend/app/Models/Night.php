<?php

namespace PTSite\App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use PTSite\App\Models\Concerns\Archivable;
use PTSite\Database\Factories\NightFactory;

#[Fillable(['season_id', 'starts_at', 'place_id', 'description', 'status', 'type', 'is_extra', 'pot', 'main_event_pot', 'time_chip'])]
class Night extends Model
{
    /** @use HasFactory<NightFactory> */
    use Archivable, HasFactory;

    protected static function newFactory(): NightFactory
    {
        return NightFactory::new();
    }

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'is_extra' => 'boolean',
            'pot' => 'decimal:2',
            'main_event_pot' => 'decimal:2',
            'time_chip' => 'decimal:2',
            'archived_at' => 'datetime',
        ];
    }

    public function scopeFinished(Builder $query): void
    {
        $query->notArchived()->where('status', 'finished');
    }

    /** The nights of the season's calendar: the ones that are not extra. A Main Event night is always extra. */
    public function scopeRounds(Builder $query): void
    {
        $query->where('is_extra', false);
    }

    /** The nights that have a pot and give points: every one but a Main Event night. */
    public function scopeScoring(Builder $query): void
    {
        $query->where('type', 'regular');
    }

    /** @return BelongsTo<Season, $this> */
    public function season(): BelongsTo
    {
        return $this->belongsTo(Season::class);
    }

    /** @return BelongsTo<Place, $this> */
    public function place(): BelongsTo
    {
        return $this->belongsTo(Place::class);
    }

    /** @return HasMany<NightAttendance, $this> */
    public function attendances(): HasMany
    {
        return $this->hasMany(NightAttendance::class)->orderBy('answered_at')->orderBy('id');
    }

    /** @return HasMany<NightResult, $this> */
    public function results(): HasMany
    {
        return $this->hasMany(NightResult::class)->orderBy('position');
    }

    /** @return HasMany<NightMainEventPosition, $this> */
    public function mainEventPositions(): HasMany
    {
        return $this->hasMany(NightMainEventPosition::class)->orderBy('position');
    }

    /** @return HasOne<NightPartialResult, $this> */
    public function partialResult(): HasOne
    {
        return $this->hasOne(NightPartialResult::class);
    }
}
