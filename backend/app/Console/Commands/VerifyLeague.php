<?php

namespace PTSite\App\Console\Commands;

use Illuminate\Console\Command;
use PTSite\App\Actions\Import\VerifyLeagueData;

class VerifyLeague extends Command
{
    protected $signature = 'ptsite:verify';

    protected $description = 'Check that every finished night\'s points match its pot and percentage table';

    public function handle(VerifyLeagueData $verify): int
    {
        $check = $verify();
        $this->info("Checked {$check['nights_checked']} finished nights.");
        foreach ($check['problems'] as $problem) {
            $this->warn("  - {$problem}");
        }

        return $check['problems'] === [] ? self::SUCCESS : self::FAILURE;
    }
}
