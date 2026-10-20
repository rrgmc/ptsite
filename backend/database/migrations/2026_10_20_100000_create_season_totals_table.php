<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // The final lines of a season known only by its final standings (docs/specs/season-totals.md).
        Schema::create('season_totals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('season_id')->constrained()->cascadeOnDelete();
            $table->foreignId('player_id')->constrained();
            $table->decimal('points', 12, 2);
            // How often the player finished in each scoring position: the 1st place first.
            $table->json('positions');
            $table->unique(['season_id', 'player_id']);
            $table->index('player_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('season_totals');
    }
};
