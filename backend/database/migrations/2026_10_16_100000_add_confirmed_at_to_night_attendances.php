<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('night_attendances', function (Blueprint $table) {
            // A removed answer keeps its row while it holds a confirmation time (docs/specs/attendance.md, rule 3).
            $table->string('answer', 10)->nullable()->change();
            // The time of the player's first ALL IN on the night. A FOLD or a removed answer keeps it.
            $table->timestamp('confirmed_at')->nullable()->after('answered_at');
        });
        DB::table('night_attendances')->where('answer', 'all_in')->update(['confirmed_at' => DB::raw('answered_at')]);
    }

    public function down(): void
    {
        DB::table('night_attendances')->whereNull('answer')->delete();
        Schema::table('night_attendances', function (Blueprint $table) {
            $table->dropColumn('confirmed_at');
            $table->string('answer', 10)->nullable(false)->change();
        });
    }
};
