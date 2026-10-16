<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/*
 * MySQL 5.7 gives the first NOT NULL timestamp column of a table "ON UPDATE CURRENT_TIMESTAMP" when
 * explicit_defaults_for_timestamp is off, so any change to a row set it to the time of the change. The migration
 * that added night_attendances.confirmed_at changed every ALL IN row that way, and their answered_at became the
 * time of that migration. confirmed_at kept the right time, so it gives it back.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('night_attendances', function (Blueprint $table) {
            $table->timestamp('answered_at')->useCurrent()->change();
        });
        Schema::table('night_partial_results', function (Blueprint $table) {
            $table->timestamp('saved_at')->useCurrent()->change();
        });
        DB::table('night_attendances')->where('answer', 'all_in')->whereNotNull('confirmed_at')
            ->update(['answered_at' => DB::raw('confirmed_at')]);
    }

    public function down(): void
    {
        Schema::table('night_attendances', function (Blueprint $table) {
            $table->timestamp('answered_at')->useCurrent()->useCurrentOnUpdate()->change();
        });
        Schema::table('night_partial_results', function (Blueprint $table) {
            $table->timestamp('saved_at')->useCurrent()->useCurrentOnUpdate()->change();
        });
    }
};
