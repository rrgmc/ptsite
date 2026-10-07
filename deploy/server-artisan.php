<?php

// Runs artisan commands on the shared host, which has no SSH. deploy/cpanel-upload.sh uploads this file into
// the site's document root under a random name, with a random token and the app's folder in place of the
// placeholders below. It calls the file once and deletes it again.
//
// The request body is a JSON list of commands, each a list of arguments: [["migrate", "--force"]].
// The answer is the commands' output as text. Its last line is "EXIT <code>", 0 when every command worked.

use Illuminate\Contracts\Console\Kernel;
use Symfony\Component\Console\Input\ArgvInput;
use Symfony\Component\Console\Output\BufferedOutput;

const TOKEN = '__DEPLOY_TOKEN__';
const APP_DIR = '__APP_DIR__';
const ALLOWED = ['migrate'];

// Without the right token the file answers like a missing page. The placeholder itself is too short to pass.
if (strlen(TOKEN) < 32 || ! hash_equals(TOKEN, $_SERVER['HTTP_X_DEPLOY_TOKEN'] ?? '')) {
    http_response_code(404);
    exit;
}

set_time_limit(0);
header('Content-Type: text/plain; charset=utf-8');

require APP_DIR.'/vendor/autoload.php';
$app = require APP_DIR.'/bootstrap/app.php';
$kernel = $app->make(Kernel::class);

$code = 0;
foreach (json_decode((string) file_get_contents('php://input'), true) ?: [] as $command) {
    echo '$ php artisan '.implode(' ', $command).PHP_EOL;
    if (! in_array($command[0] ?? null, ALLOWED, true)) {
        echo 'This command is not allowed.'.PHP_EOL;
        $code = 1;
        break;
    }
    $output = new BufferedOutput;
    $code = $kernel->handle(new ArgvInput(['artisan', ...$command, '--no-interaction']), $output);
    echo $output->fetch();
    if ($code !== 0) {
        break;
    }
}
echo PHP_EOL.'EXIT '.$code.PHP_EOL;
