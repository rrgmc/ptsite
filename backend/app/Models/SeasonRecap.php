<?php

namespace PTSite\App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A text about how a season is going, usually written after one of its nights. */
#[Fillable(['season_id', 'night_id', 'body', 'author_user_id', 'published_at'])]
class SeasonRecap extends Model
{
    protected function casts(): array
    {
        return ['published_at' => 'datetime'];
    }

    public function scopePublished(Builder $query): void
    {
        $query->whereNotNull('published_at');
    }

    /** Newest first, by when it was written. */
    public function scopeNewestFirst(Builder $query): void
    {
        $query->latest('created_at')->latest('id');
    }

    /** @return BelongsTo<Season, $this> */
    public function season(): BelongsTo
    {
        return $this->belongsTo(Season::class);
    }

    /** @return BelongsTo<Night, $this> */
    public function night(): BelongsTo
    {
        return $this->belongsTo(Night::class);
    }

    /** @return BelongsTo<User, $this> */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_user_id');
    }
}
