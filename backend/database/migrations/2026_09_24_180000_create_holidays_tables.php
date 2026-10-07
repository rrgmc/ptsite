<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use PTSite\Domain\Calendar\HolidayPresets;

// The holiday table and its per-year exceptions, used by the season planner (docs/specs/season-planner.md).
// The table starts with the holiday preset named in config/ptsite.php, also in production; admins edit it after
// that.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('holidays', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('scope', 10); // national | state | city
            $table->unsignedTinyInteger('month')->nullable(); // fixed-date holidays
            $table->unsignedTinyInteger('day')->nullable();
            $table->smallInteger('easter_offset')->nullable(); // Easter-based holidays: days after Easter Sunday
            $table->unsignedSmallInteger('first_year')->nullable();
            $table->unsignedSmallInteger('last_year')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();
        });

        Schema::create('holiday_exceptions', function (Blueprint $table) {
            $table->id();
            $table->unsignedSmallInteger('year');
            $table->foreignId('holiday_id')->nullable()->constrained()->cascadeOnDelete(); // set: cancelled that year
            $table->date('date')->nullable(); // set: an extra holiday that year
            $table->string('name', 100)->nullable();
            $table->timestamps();
            $table->unique(['year', 'holiday_id']);
        });

        Schema::table('seasons', function (Blueprint $table) {
            // Two weeks apart is the most common cadence.
            $table->unsignedTinyInteger('schedule_every_weeks')->default(2)->after('schedule_time');
        });

        $now = now();
        foreach (HolidayPresets::rules(config('ptsite.holidays.preset')) as $rule) {
            DB::table('holidays')->insert([
                'name' => $rule->name,
                'scope' => $rule->scope->value,
                'month' => $rule->month,
                'day' => $rule->day,
                'easter_offset' => $rule->easterOffset,
                'first_year' => $rule->firstYear,
                'last_year' => $rule->lastYear,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('seasons', function (Blueprint $table) {
            $table->dropColumn('schedule_every_weeks');
        });
        Schema::dropIfExists('holiday_exceptions');
        Schema::dropIfExists('holidays');
    }
};
