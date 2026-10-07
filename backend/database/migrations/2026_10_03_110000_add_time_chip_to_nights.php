<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('nights', function (Blueprint $table) {
            // The money set aside for the year party: paid with every rebuy and by players who arrive late.
            $table->decimal('time_chip', 12, 2)->nullable()->after('main_event_pot');
        });
    }

    public function down(): void
    {
        Schema::table('nights', function (Blueprint $table) {
            $table->dropColumn('time_chip');
        });
    }
};
