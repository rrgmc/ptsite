<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// A season's regular night, used to suggest dates when scheduling (docs/specs/seasons-and-nights.md).
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('seasons', function (Blueprint $table) {
            $table->unsignedTinyInteger('schedule_weekday')->default(5)->after('buy_in'); // ISO: 1 = Monday … 7 = Sunday
            $table->string('schedule_time', 5)->default('21:00')->after('schedule_weekday');
        });
    }

    public function down(): void
    {
        Schema::table('seasons', function (Blueprint $table) {
            $table->dropColumn(['schedule_weekday', 'schedule_time']);
        });
    }
};
