<?php

namespace PTSite\App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** One rebuy of a player on a night. */
#[Fillable(['night_id', 'player_id', 'paid_at', 'non_cash', 'created_by_user_id', 'updated_by_user_id'])]
class NightRebuy extends Model
{
    protected function casts(): array
    {
        return ['paid_at' => 'datetime', 'non_cash' => 'boolean'];
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
