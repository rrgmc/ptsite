<?php

namespace PTSite\App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/** The season's money settings as they were when a night was finished. */
#[Fillable(['night_id', 'buy_in', 'rebuy_value', 'time_chip_value', 'house_owner_buy_in', 'rebuys_allowed', 'rebuy_charges_time_chip', 'allows_extra_rebuys'])]
class NightPrice extends Model
{
    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'buy_in' => 'decimal:2',
            'rebuy_value' => 'decimal:2',
            'time_chip_value' => 'decimal:2',
            'house_owner_buy_in' => 'decimal:2',
            'rebuys_allowed' => 'integer',
            'rebuy_charges_time_chip' => 'boolean',
            'allows_extra_rebuys' => 'boolean',
        ];
    }
}
