<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Texts about how a season is going, usually one after each night (docs/specs/season-recaps.md).
        Schema::create('season_recaps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('season_id')->constrained()->cascadeOnDelete();
            // The night the recap comes after, when it is about one. A night has at most one recap.
            $table->foreignId('night_id')->nullable()->unique()->constrained()->nullOnDelete();
            $table->text('body');
            $table->foreignId('author_user_id')->nullable()->constrained('users')->nullOnDelete();
            // Null while it is a draft.
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->index(['season_id', 'published_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('season_recaps');
    }
};
