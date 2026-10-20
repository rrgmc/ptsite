<?php

namespace PTSite\App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A player's final line of a season known only by its final standings. */
#[Fillable(['player_id', 'points', 'positions'])]
class SeasonTotal extends Model
{
    public $timestamps = false;

    protected function casts(): array
    {
        return ['points' => 'decimal:2', 'positions' => 'array'];
    }

    /** @return BelongsTo<Season, $this> */
    public function season(): BelongsTo
    {
        return $this->belongsTo(Season::class);
    }

    /** @return BelongsTo<Player, $this> */
    public function player(): BelongsTo
    {
        return $this->belongsTo(Player::class);
    }
}
