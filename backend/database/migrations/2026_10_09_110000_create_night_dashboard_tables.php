<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// What the night dashboard records (docs/specs/night-dashboard.md): who took part in a night, what they bought
// and what they paid. Kept after the night is finished.
return new class extends Migration
{
    public function up(): void
    {
        // A participant of a night. A date says when the mark was set; null means it is not set.
        Schema::create('night_players', function (Blueprint $table) {
            $table->id();
            $table->foreignId('night_id')->constrained()->cascadeOnDelete();
            $table->foreignId('player_id')->constrained();
            $table->timestamp('buy_in_paid_at')->nullable();
            // The player arrived late and owes a time chip.
            $table->timestamp('time_chip_at')->nullable();
            $table->timestamp('time_chip_paid_at')->nullable();
            $table->foreignId('updated_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['night_id', 'player_id']);
        });

        // One row for each rebuy of a player on a night.
        Schema::create('night_rebuys', function (Blueprint $table) {
            $table->id();
            $table->foreignId('night_id')->constrained()->cascadeOnDelete();
            $table->foreignId('player_id')->constrained();
            $table->timestamp('paid_at')->nullable();
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['night_id', 'player_id']);
        });

        // The season's money settings as they were when the night was finished, so a later change to the season
        // does not change what a finished night charged.
        Schema::create('night_prices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('night_id')->unique()->constrained()->cascadeOnDelete();
            $table->decimal('buy_in', 12, 2)->nullable();
            $table->decimal('rebuy_value', 12, 2)->nullable();
            $table->decimal('time_chip_value', 12, 2)->nullable();
            $table->decimal('house_owner_buy_in', 12, 2)->nullable();
            $table->unsignedTinyInteger('rebuys_allowed')->default(0);
            $table->boolean('rebuy_charges_time_chip')->default(false);
            $table->boolean('allows_extra_rebuys')->default(false);
        });

        Schema::table('nights', function (Blueprint $table) {
            // The owner of the house where the night is played, who may pay a smaller buy-in.
            $table->foreignId('house_owner_player_id')->nullable()->after('place_id')->constrained('players')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('nights', function (Blueprint $table) {
            $table->dropConstrainedForeignId('house_owner_player_id');
        });
        Schema::dropIfExists('night_prices');
        Schema::dropIfExists('night_rebuys');
        Schema::dropIfExists('night_players');
    }
};
