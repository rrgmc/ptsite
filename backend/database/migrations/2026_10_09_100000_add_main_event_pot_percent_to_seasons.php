<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('seasons', function (Blueprint $table) {
            // The share of a night's pot that the night dashboard suggests as its Main Event pot, in whole percent.
            $table->unsignedTinyInteger('main_event_pot_percent')->nullable()->after('house_owner_buy_in');
        });
    }

    public function down(): void
    {
        Schema::table('seasons', function (Blueprint $table) {
            $table->dropColumn('main_event_pot_percent');
        });
    }
};
