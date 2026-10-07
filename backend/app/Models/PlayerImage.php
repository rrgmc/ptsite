<?php

namespace PTSite\App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use PTSite\App\Enums\PlayerImageKind;

#[Fillable(['player_id', 'kind', 'mime_type', 'image'])]
class PlayerImage extends Model
{
    protected function casts(): array
    {
        return [
            'kind' => PlayerImageKind::class,
        ];
    }
}
