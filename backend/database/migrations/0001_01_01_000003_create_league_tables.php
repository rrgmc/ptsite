<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('places', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->text('address')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->unsignedInteger('legacy_id')->nullable()->unique();
            $table->timestamps();
        });

        Schema::create('players', function (Blueprint $table) {
            $table->id();
            $table->string('nickname', 60)->unique();
            $table->string('name', 100)->nullable();
            $table->string('email')->nullable();
            $table->date('birth_date')->nullable();
            $table->string('status', 20)->default('active'); // active | inactive
            $table->timestamp('archived_at')->nullable();
            $table->unsignedInteger('legacy_id')->nullable()->unique();
            $table->timestamps();
            $table->index(['status', 'archived_at']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('player_id')->nullable()->unique()->after('id')->constrained()->nullOnDelete();
            $table->unsignedInteger('legacy_id')->nullable();
            $table->string('legacy_source', 10)->nullable(); // user | admin
            $table->unique(['legacy_source', 'legacy_id']);
        });

        Schema::create('seasons', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->date('starts_on');
            $table->foreignId('default_place_id')->nullable()->constrained('places')->nullOnDelete();
            $table->text('description')->nullable();
            $table->decimal('buy_in', 12, 2)->nullable();
            $table->boolean('is_open')->default(true);
            $table->boolean('is_finished')->default(false);
            $table->timestamp('archived_at')->nullable();
            $table->unsignedInteger('legacy_id')->nullable()->unique();
            $table->timestamps();
        });

        Schema::create('season_percentages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('season_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('position');
            $table->unsignedTinyInteger('percent');
            $table->unique(['season_id', 'position']);
        });

        Schema::create('nights', function (Blueprint $table) {
            $table->id();
            $table->foreignId('season_id')->constrained();
            $table->dateTime('starts_at');
            $table->foreignId('place_id')->nullable()->constrained()->nullOnDelete();
            $table->text('description')->nullable();
            $table->string('status', 20)->default('scheduled'); // scheduled | open | finished
            $table->decimal('pot', 12, 2)->nullable();
            $table->decimal('main_event_pot', 12, 2)->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->unsignedInteger('legacy_id')->nullable()->unique();
            $table->timestamps();
            $table->index(['season_id', 'status', 'archived_at']);
        });

        Schema::create('night_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('night_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('position');
            $table->foreignId('player_id')->constrained();
            $table->decimal('points', 12, 2);
            $table->unique(['night_id', 'position']);
            $table->unique(['night_id', 'player_id']);
            $table->index('player_id');
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action', 60);
            $table->string('subject_type', 40);
            $table->unsignedBigInteger('subject_id');
            $table->json('before')->nullable();
            $table->json('after')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index(['subject_type', 'subject_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('night_results');
        Schema::dropIfExists('nights');
        Schema::dropIfExists('season_percentages');
        Schema::dropIfExists('seasons');
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['legacy_source', 'legacy_id']);
            $table->dropConstrainedForeignId('player_id');
            $table->dropColumn(['legacy_id', 'legacy_source']);
        });
        Schema::dropIfExists('players');
        Schema::dropIfExists('places');
    }
};
