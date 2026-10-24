<?php

namespace PTSite\App\Console\Commands;

use Illuminate\Console\Command;
use PTSite\App\Actions\Auth\CreateWriterToken;
use PTSite\Domain\Shared\RuleViolation;

class CreateWriterTokenCommand extends Command
{
    protected $signature = 'ptsite:writer-token
        {username=writer : The writer account, made the first time}
        {--name=api : A name for the token}
        {--replace : Delete the account\'s other tokens first}';

    protected $description = 'Print an API token for a writer account, which writes the memos and the season recaps';

    public function handle(CreateWriterToken $create): int
    {
        try {
            ['token' => $token] = $create(null, (string) $this->argument('username'), (string) $this->option('name'), (bool) $this->option('replace'));
        } catch (RuleViolation $violation) {
            $this->error(__('rules.'.$violation->rule));

            return self::FAILURE;
        }
        $this->line($token);

        return self::SUCCESS;
    }
}
