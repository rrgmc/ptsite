<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('night_players', function (Blueprint $table) {
            // The buy-in was paid, but not in cash (a bank transfer, for instance). It covers the player's time chip too.
            $table->boolean('buy_in_non_cash')->default(false)->after('buy_in_paid_at');
        });
        Schema::table('night_rebuys', function (Blueprint $table) {
            // The rebuy was paid, but not in cash. It covers the time chip the rebuy pays too.
            $table->boolean('non_cash')->default(false)->after('paid_at');
        });
        Schema::table('nights', function (Blueprint $table) {
            // An amount typed by hand that is added to what was paid not in cash. It may be negative.
            $table->decimal('non_cash_adjustment', 12, 2)->nullable()->after('time_chip');
        });
    }

    public function down(): void
    {
        Schema::table('night_players', function (Blueprint $table) {
            $table->dropColumn('buy_in_non_cash');
        });
        Schema::table('night_rebuys', function (Blueprint $table) {
            $table->dropColumn('non_cash');
        });
        Schema::table('nights', function (Blueprint $table) {
            $table->dropColumn('non_cash_adjustment');
        });
    }
};
