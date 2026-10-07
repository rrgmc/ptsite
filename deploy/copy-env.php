<?php

// Gives the app folder (APP_DIR) the .env of another app folder on the host, with deploy/cpanel-copy-env.sh.
// It is for moving a site to a fresh app folder.
//
//   php deploy/copy-env.php <app folder to copy from> [NAME=value ...] [--dry-run]
//
// - Each NAME=value replaces that setting in the copy: APP_URL=https://next.example.com for a test address.
// - The cPanel API token comes from DEPLOY_CPANEL_TOKEN or local/keys.md, as in deploy/upload.php.
// - The .env is never written to this machine, and no value is printed.

require __DIR__.'/lib.php';

$args = array_slice($argv, 1);
$dryRun = in_array('--dry-run', $args, true);
$args = array_values(array_filter($args, fn (string $arg) => $arg !== '--dry-run'));
$args !== [] || fail('Usage: php deploy/copy-env.php <app folder to copy from> [NAME=value ...] [--dry-run]');

// The script needs no files of ours: an empty folder is its working folder.
$files = root('local/build/copy-env');
remove_dir($files);
make_dir($files);

run_cpanel_script('cpanel-copy-env.sh', $args, $files, cpanel_env(), $dryRun);
