<?php

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schema;
use PTSite\App\Actions\Import\VerifyLeagueData;
use PTSite\App\Support\DatabaseCreator;

Artisan::command('ptsite:prepare-database {--seed : Also migrate and seed the database when it has no tables}', function () {
    if (app()->isProduction()) {
        $this->error('This command is for the development server only.');

        return 1;
    }

    DatabaseCreator::createIfMissing();
    if ($this->option('seed') && ! Schema::hasTable(config('database.migrations.table'))) {
        return $this->call('migrate', ['--seed' => true]);
    }

    return 0;
})->purpose('Create the development database when the MySQL server does not have it');

Artisan::command('ptsite:verify', function (VerifyLeagueData $verify) {
    $check = $verify();
    $this->info("Checked {$check['nights_checked']} finished nights.");
    foreach ($check['problems'] as $problem) {
        $this->warn("  - {$problem}");
    }

    return $check['problems'] === [] ? 0 : 1;
})->purpose('Check that every finished night\'s points match its pot and percentage table');
