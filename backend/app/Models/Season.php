<?php

namespace PTSite\App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use PTSite\App\Models\Concerns\Archivable;
use PTSite\Database\Factories\SeasonFactory;

#[Fillable(['name', 'starts_on', 'default_place_id', 'description', 'buy_in', 'rebuy_value', 'time_chip_value', 'rebuys_allowed', 'rebuy_charges_time_chip', 'allows_extra_rebuys', 'house_owner_buy_in', 'is_open', 'is_finished', 'schedule_weekday', 'schedule_time', 'schedule_every_weeks', 'rounds'])]
class Season extends Model
{
    /** @use HasFactory<SeasonFactory> */
    use Archivable, HasFactory;

    protected static function newFactory(): SeasonFactory
    {
        return SeasonFactory::new();
    }

    protected function casts(): array
    {
        return [
            'starts_on' => 'date',
            'buy_in' => 'decimal:2',
            'rebuy_value' => 'decimal:2',
            'time_chip_value' => 'decimal:2',
            'rebuys_allowed' => 'integer',
            'rebuy_charges_time_chip' => 'boolean',
            'allows_extra_rebuys' => 'boolean',
            'house_owner_buy_in' => 'decimal:2',
            'is_open' => 'boolean',
            'is_finished' => 'boolean',
            'schedule_weekday' => 'integer',
            'schedule_every_weeks' => 'integer',
            'rounds' => 'integer',
            'archived_at' => 'datetime',
        ];
    }

    /** The current season is the newest season that is open and not finished. */
    public function scopeCurrent(Builder $query): void
    {
        $query->notArchived()->where('is_open', true)->where('is_finished', false)->latest('starts_on')->latest('id');
    }

    /** @return BelongsTo<Place, $this> */
    public function defaultPlace(): BelongsTo
    {
        return $this->belongsTo(Place::class, 'default_place_id');
    }

    /** @return HasMany<SeasonPercentage, $this> */
    public function percentages(): HasMany
    {
        return $this->hasMany(SeasonPercentage::class)->orderBy('position');
    }

    /** @return HasMany<Night, $this> */
    public function nights(): HasMany
    {
        return $this->hasMany(Night::class);
    }

    /** @return array<int, int> position => percent */
    public function percentByPosition(): array
    {
        return $this->percentages->pluck('percent', 'position')->map(fn ($p) => (int) $p)->all();
    }
}
