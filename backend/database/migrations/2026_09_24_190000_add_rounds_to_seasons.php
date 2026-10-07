<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// How many nights ("rodadas") a season has, usually 26 (docs/specs/seasons-and-nights.md).
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('seasons', function (Blueprint $table) {
            $table->unsignedSmallInteger('rounds')->default(26)->after('buy_in');
        });
    }

    public function down(): void
    {
        Schema::table('seasons', function (Blueprint $table) {
            $table->dropColumn('rounds');
        });
    }
};
