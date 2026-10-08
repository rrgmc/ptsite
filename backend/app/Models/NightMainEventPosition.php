<?php

namespace PTSite\App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** One place in the result of a Main Event night. */
#[Fillable(['position', 'player_id'])]
class NightMainEventPosition extends Model
{
    public $timestamps = false;

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
