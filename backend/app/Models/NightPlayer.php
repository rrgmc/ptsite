<?php

namespace PTSite\App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A participant of a night, with the marks of the night dashboard. A date says when a mark was set. */
#[Fillable(['night_id', 'player_id', 'buy_in_paid_at', 'time_chip_at', 'time_chip_paid_at', 'updated_by_user_id'])]
class NightPlayer extends Model
{
    protected function casts(): array
    {
        return [
            'buy_in_paid_at' => 'datetime',
            'time_chip_at' => 'datetime',
            'time_chip_paid_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Night, $this> */
    public function night(): BelongsTo
    {
        return $this->belongsTo(Night::class);
    }

    /** @return BelongsTo<Player, $this> */
    public function player(): BelongsTo
    {
        return $this->belongsTo(Player::class);
    }
}
