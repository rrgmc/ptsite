<?php

// Uploads a deploy package to the site on its shared host with deploy/cpanel-upload.sh, or with deploy/ftp-upload.sh.
//
//   php deploy/upload.php <package.zip> [--ftp] [--no-index] [--env <file>] [--migrate] [--dry-run]
//
// - --ftp uploads over FTP with TLS instead of the cPanel API. The FTP account comes from DEPLOY_FTP_HOST,
//   DEPLOY_FTP_USER and DEPLOY_FTP_PASSWORD, or else from the "FTP host:", "FTP user:" and
//   "FTP password:" lines of local/keys.md. It needs no cPanel token, and cannot upload a .env. See deploy/ftp-upload.sh.
// - --migrate runs the migrations on the server, keeping its data. See deploy/cpanel-upload.sh.
// - The cPanel API token comes from DEPLOY_CPANEL_TOKEN, or else from the "cPanel token:" line of
//   local/keys.md. It reaches the upload script through the environment only and is never printed.
// - DEPLOY_CPANEL_USER and DEPLOY_CPANEL_URL must be set (a site sets them in local/deploy.env, see Taskfile.yml).
// - --no-index replaces public/robots.txt in the package with one that blocks every search engine.
// - On Windows the upload runs in a container: Git for Windows' curl stalls on large uploads (see
//   docs/architecture/deployment.md). Docker must be running.
// - --dry-run prints the command instead of running it.

require __DIR__.'/lib.php';

$package = $envFile = null;
$noIndex = $migrate = $dryRun = $ftp = false;
$args = array_slice($argv, 1);
while ($args) {
    $arg = array_shift($args);
    match ($arg) {
        '--no-index' => $noIndex = true,
        '--migrate' => $migrate = true,
        '--dry-run' => $dryRun = true,
        '--ftp' => $ftp = true,
        '--env' => $envFile = array_shift($args),
        default => str_starts_with($arg, '-') ? fail("Unknown option $arg") : $package = $arg,
    };
}
foreach (['package' => $package, '--env' => $envFile] as $what => $file) {
    if ($what === 'package' ? ! is_file((string) $file) : $file !== null && ! is_file($file)) {
        fail("No $what file: ".($file ?? '(none given)'));
    }
}

if ($ftp && $envFile !== null) {
    fail('--ftp does not upload a .env: use the cPanel API for that (leave --ftp out).');
}
$env = $ftp ? ftp_env() : cpanel_env();

// Everything to upload goes into one folder, so the container needs a single mount.
$upload = root('local/build/upload');
remove_dir($upload);
make_dir($upload);
copy($package, "$upload/package.zip") || fail("Could not copy $package");
$scriptArgs = ['package.zip'];
if ($envFile !== null) {
    copy($envFile, "$upload/env");
    array_push($scriptArgs, '--env', 'env');
}
if ($migrate) {
    $scriptArgs[] = '--migrate';
}

if ($noIndex) {
    $zip = new ZipArchive;
    $zip->open("$upload/package.zip") === true || fail("Could not open $package");
    $zip->addFromString('public/robots.txt', "User-agent: *\nDisallow: /\n");
    $zip->setExternalAttributesName('public/robots.txt', ZipArchive::OPSYS_UNIX, 0100644 << 16);
    $zip->close() || fail('Could not write robots.txt into the package.');
}

// The document root gets the contents of public/ only. Its index.php and .htaccess are written by the upload
// script, so they stay out of this zip.
$zip = new ZipArchive;
$zip->open("$upload/package.zip", ZipArchive::RDONLY) === true || fail("Could not open $package");
$web = new ZipArchive;
$web->open("$upload/web.zip", ZipArchive::CREATE) === true || fail('Could not create web.zip.');
for ($i = 0; $i < $zip->numFiles; $i++) {
    $name = (string) $zip->getNameIndex($i);
    if (! str_starts_with($name, 'public/') || str_ends_with($name, '/')
        || in_array($name, ['public/index.php', 'public/.htaccess'], true)) {
        continue;
    }
    $webName = substr($name, strlen('public/'));
    $web->addFromString($webName, (string) $zip->getFromIndex($i));
    $web->setExternalAttributesName($webName, ZipArchive::OPSYS_UNIX, 0100644 << 16);
}
$web->count() > 0 || fail("No public/ files in $package");
$web->close() || fail('Could not write web.zip.');
$zip->close();
array_push($scriptArgs, '--web', 'web.zip');

run_cpanel_script($ftp ? 'ftp-upload.sh' : 'cpanel-upload.sh', $scriptArgs, $upload, $env, $dryRun);
