<?php

namespace PTSite\App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use PTSite\App\Models\Concerns\Archivable;
use PTSite\Database\Factories\PlaceFactory;

#[Fillable(['name', 'address'])]
class Place extends Model
{
    /** @use HasFactory<PlaceFactory> */
    use Archivable, HasFactory;

    protected static function newFactory(): PlaceFactory
    {
        return PlaceFactory::new();
    }

    protected function casts(): array
    {
        return ['archived_at' => 'datetime'];
    }
}
