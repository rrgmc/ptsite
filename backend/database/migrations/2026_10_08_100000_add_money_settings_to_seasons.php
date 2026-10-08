<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // What a night of the season costs (docs/specs/seasons-and-nights.md). No rule calculates with these yet.
        Schema::table('seasons', function (Blueprint $table) {
            // A rebuy's price, without the time chip it may also charge.
            $table->decimal('rebuy_value', 12, 2)->nullable()->after('buy_in');
            $table->decimal('time_chip_value', 12, 2)->nullable()->after('rebuy_value');
            // How many rebuys a player can make on a night; 0 means none.
            $table->unsignedTinyInteger('rebuys_allowed')->default(0)->after('time_chip_value');
            $table->boolean('rebuy_charges_time_chip')->default(false)->after('rebuys_allowed');
            // Rebuys past the allowed number, which do not count for the season's points.
            $table->boolean('allows_extra_rebuys')->default(false)->after('rebuy_charges_time_chip');
            // The smaller buy-in of the owner of the house where the night is played.
            $table->decimal('house_owner_buy_in', 12, 2)->nullable()->after('allows_extra_rebuys');
        });
    }

    public function down(): void
    {
        Schema::table('seasons', function (Blueprint $table) {
            $table->dropColumn(['rebuy_value', 'time_chip_value', 'rebuys_allowed', 'rebuy_charges_time_chip', 'allows_extra_rebuys', 'house_owner_buy_in']);
        });
    }
};
