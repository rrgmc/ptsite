<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Players' images (docs/specs/players.md): the thumbnail, a small photo next to a nickname, and the photo, a
// larger one. They are in a table of their own so that reading players never loads them; the two version
// columns of players say which images a player has.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('player_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('player_id')->constrained()->cascadeOnDelete();
            $table->string('kind', 20); // thumbnail | photo
            $table->string('mime_type', 30);
            // A photo can be larger than the 64 KB of MySQL's blob.
            $table->rawColumn('image', 'mediumblob')->nullable(false);
            $table->timestamps();
            $table->unique(['player_id', 'kind']);
        });

        Schema::table('players', function (Blueprint $table) {
            // Each changes with its image, so the image's URL can be cached for good. Null: no such image.
            $table->string('thumbnail_version', 16)->nullable()->after('status');
            $table->string('photo_version', 16)->nullable()->after('thumbnail_version');
        });
    }

    public function down(): void
    {
        Schema::table('players', function (Blueprint $table) {
            $table->dropColumn(['thumbnail_version', 'photo_version']);
        });
        Schema::dropIfExists('player_images');
    }
};
