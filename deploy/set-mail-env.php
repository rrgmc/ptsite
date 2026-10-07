<?php

// Puts the mail settings into the .env of the site on its shared host, with deploy/cpanel-mail-env.sh.
//
//   php deploy/set-mail-env.php [--dry-run]
//
// - The mailbox comes from the "Email user:" and "Email password:" lines of local/keys.md. The site sends its
//   mail through it (docs/architecture/deployment.md, "Email"). Neither value is ever printed.
// - MAIL_HOST is the mail server's name (required; port 465 with TLS). MAIL_FROM_NAME is the sender's name
//   (required), usually the site's name.
// - The cPanel API token comes from DEPLOY_CPANEL_TOKEN or local/keys.md, as in deploy/upload.php.
// - --dry-run prints the command instead of running it.

require __DIR__.'/lib.php';

$dryRun = in_array('--dry-run', $argv, true);

$keys = (string) @file_get_contents(root('local/keys.md'));
preg_match('/^Email user:\s*(\S+)/m', $keys, $user) || fail('Add an "Email user: <mailbox>" line to local/keys.md.');
preg_match('/^Email password:\s*(\S.*?)\s*$/m', $keys, $password) || fail('Add an "Email password: <password>" line to local/keys.md.');
filter_var($user[1], FILTER_VALIDATE_EMAIL) || fail('The "Email user:" line of local/keys.md must be the whole address of the mailbox.');
// The value is written between single quotes, which .env reads as they are.
str_contains($password[1], "'") && fail('The mailbox password has a single quote, which this script cannot write. Change the password.');

$mailHost = getenv('MAIL_HOST') ?: fail('Set MAIL_HOST to the name of the mail server.');
$fromName = getenv('MAIL_FROM_NAME') ?: fail('Set MAIL_FROM_NAME to the name the site sends mail as.');
str_contains($fromName, '"') && fail('MAIL_FROM_NAME cannot hold a double quote.');

$env = cpanel_env();

$files = root('local/build/mail-env');
remove_dir($files);
make_dir($files);
// The file holds the password, so it goes away however the script ends.
register_shutdown_function(fn () => remove_dir($files));
file_put_contents("$files/mail.env", implode("\n", [
    'MAIL_MAILER=smtp',
    'MAIL_SCHEME=smtps',
    'MAIL_HOST='.$mailHost,
    'MAIL_PORT=465',
    'MAIL_USERNAME='.$user[1],
    "MAIL_PASSWORD='{$password[1]}'",
    'MAIL_FROM_ADDRESS='.$user[1],
    'MAIL_FROM_NAME="'.$fromName.'"',
])."\n");

run_cpanel_script('cpanel-mail-env.sh', ['mail.env'], $files, $env, $dryRun);
