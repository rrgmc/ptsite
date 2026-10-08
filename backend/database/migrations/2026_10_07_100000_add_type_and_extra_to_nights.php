<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// The type of a night and the extra nights (docs/specs/main-event.md, docs/specs/seasons-and-nights.md).
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('nights', function (Blueprint $table) {
            // regular: a pot and points. main_event: the order of its players, kept in the table below.
            $table->string('type', 20)->default('regular')->after('status');
            // Outside the season's calendar: it is not a round and may share its date. Always true for a Main Event.
            $table->boolean('is_extra')->default(false)->after('type');
        });

        Schema::create('night_main_event_positions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('night_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('position');
            $table->foreignId('player_id')->constrained();
            // Named by hand: the default names are longer than MySQL's 64 characters with a table prefix.
            $table->unique(['night_id', 'position'], 'night_main_event_position_unique');
            $table->unique(['night_id', 'player_id'], 'night_main_event_player_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('night_main_event_positions');
        Schema::table('nights', function (Blueprint $table) {
            $table->dropColumn(['type', 'is_extra']);
        });
    }
};
