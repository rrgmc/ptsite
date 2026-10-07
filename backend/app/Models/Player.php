<?php

namespace PTSite\App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use PTSite\App\Enums\PlayerStatus;
use PTSite\App\Models\Concerns\Archivable;
use PTSite\Database\Factories\PlayerFactory;

#[Fillable(['nickname', 'name', 'email', 'birth_date', 'memo', 'status'])]
class Player extends Model
{
    /** @use HasFactory<PlayerFactory> */
    use Archivable, HasFactory;

    protected static function newFactory(): PlayerFactory
    {
        return PlayerFactory::new();
    }

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
            'status' => PlayerStatus::class,
            'archived_at' => 'datetime',
        ];
    }

    /** @return HasOne<User, $this> */
    public function user(): HasOne
    {
        return $this->hasOne(User::class);
    }

    /** @return HasMany<PlayerImage, $this> */
    public function images(): HasMany
    {
        return $this->hasMany(PlayerImage::class);
    }

    /** @return HasMany<NightResult, $this> */
    public function results(): HasMany
    {
        return $this->hasMany(NightResult::class);
    }
}
