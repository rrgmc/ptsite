<?php

namespace PTSite\App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['position', 'percent'])]
class SeasonPercentage extends Model
{
    public $timestamps = false;

    protected function casts(): array
    {
        return ['position' => 'integer', 'percent' => 'integer'];
    }
}
