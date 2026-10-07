<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// An open night's partial result ("Resultado parcial"): what the players know so far
// (docs/specs/seasons-and-nights.md). One per night, deleted when the night is finished.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('night_partial_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('night_id')->unique()->constrained()->cascadeOnDelete();
            $table->decimal('pot', 12, 2)->nullable();
            $table->decimal('main_event_pot', 12, 2)->nullable();
            $table->decimal('time_chip', 12, 2)->nullable();
            $table->foreignId('saved_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('saved_at');
        });

        Schema::create('night_partial_result_positions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partial_result_id')->constrained('night_partial_results')->cascadeOnDelete();
            $table->unsignedTinyInteger('position');
            $table->foreignId('player_id')->constrained();
            // Named by hand: the default name is longer than MySQL's 64 characters.
            $table->unique(['partial_result_id', 'position'], 'night_partial_positions_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('night_partial_result_positions');
        Schema::dropIfExists('night_partial_results');
    }
};
