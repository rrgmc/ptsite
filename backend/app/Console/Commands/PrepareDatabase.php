<?php

namespace PTSite\App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;
use PTSite\App\Support\DatabaseCreator;

class PrepareDatabase extends Command
{
    protected $signature = 'ptsite:prepare-database {--seed : Also migrate and seed the database when it has no tables}';

    protected $description = 'Create the development database when the MySQL server does not have it';

    public function handle(): int
    {
        if (app()->isProduction()) {
            $this->error('This command is for the development server only.');

            return self::FAILURE;
        }

        DatabaseCreator::createIfMissing();
        if ($this->option('seed') && ! Schema::hasTable(config('database.migrations.table'))) {
            return $this->call('migrate', ['--seed' => true]);
        }

        return self::SUCCESS;
    }
}
