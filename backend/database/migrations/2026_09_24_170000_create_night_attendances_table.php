<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Players' answers for a night: "ALL IN" (coming) or "FOLD" (docs/specs/attendance.md).
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('night_attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('night_id')->constrained()->cascadeOnDelete();
            $table->foreignId('player_id')->constrained();
            $table->string('answer', 10); // all_in | fold
            $table->timestamp('answered_at');
            $table->foreignId('answered_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->unique(['night_id', 'player_id']);
            $table->index(['night_id', 'answered_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('night_attendances');
    }
};
