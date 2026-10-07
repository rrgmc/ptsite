<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** A free text about the player, written by an admin and shown on the player's page. */
    public function up(): void
    {
        Schema::table('players', function (Blueprint $table) {
            $table->text('memo')->nullable()->after('birth_date');
        });
    }

    public function down(): void
    {
        Schema::table('players', function (Blueprint $table) {
            $table->dropColumn('memo');
        });
    }
};
