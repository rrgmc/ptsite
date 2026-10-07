<?php

// Helpers shared by the deploy scripts. They run from PowerShell, Git Bash and Linux alike, so they use no
// Unix tools: see Taskfile.yml.

const CORE_ROOT = __DIR__.'/..';

/** A path inside this repository, the core: its scripts, its backend package and its frontend. */
function core_root(string $path = ''): string
{
    return str_replace('\\', '/', realpath(CORE_ROOT)).($path === '' ? '' : '/'.$path);
}

/**
 * A path inside the project being built or deployed: its `local/` folder, its git checkout. It is the core
 * itself, unless PTSITE_PROJECT_ROOT names a site's own repository, which has the core as a submodule.
 */
function root(string $path = ''): string
{
    $project = getenv('PTSITE_PROJECT_ROOT');
    if ($project === false || $project === '') {
        return core_root($path);
    }
    $real = realpath($project) ?: fail("PTSITE_PROJECT_ROOT is not a folder: $project");

    return str_replace('\\', '/', $real).($path === '' ? '' : '/'.$path);
}

/** Whether the project is a site's own repository, not the core. */
function is_site(): bool
{
    return root() !== core_root();
}

function fail(string $message): never
{
    fwrite(STDERR, $message.PHP_EOL);
    exit(1);
}

/**
 * Runs a command and stops the script when it fails. A string goes through the system shell, which finds
 * composer.bat and npx.cmd on Windows. An array starts the program directly.
 *
 * @param  string|list<string>  $command
 * @param  array<string, string>  $env  added to the current environment
 */
function run(string|array $command, string $cwd, array $env = []): void
{
    $process = proc_open($command, [STDIN, STDOUT, STDERR], $pipes, $cwd, $env + getenv());
    $code = is_resource($process) ? proc_close($process) : 1;
    if ($code !== 0) {
        fail('Failed ('.$code.'): '.(is_array($command) ? implode(' ', $command) : $command));
    }
}

/**
 * The settings a cPanel script needs that are not in the environment yet. The API token comes from
 * DEPLOY_CPANEL_TOKEN, or else from the "cPanel token:" line of local/keys.md. It is never printed.
 *
 * @return array<string, string>
 */
function cpanel_env(): array
{
    foreach (['DEPLOY_CPANEL_USER', 'DEPLOY_CPANEL_URL'] as $name) {
        getenv($name) || fail("Set $name.");
    }
    if (getenv('DEPLOY_CPANEL_TOKEN')) {
        return [];
    }
    $keys = @file_get_contents(root('local/keys.md'));
    if (! $keys || ! preg_match('/^cPanel token:\s*(\S+)/m', $keys, $match)) {
        fail('Set DEPLOY_CPANEL_TOKEN, or add a "cPanel token: <token>" line to local/keys.md.');
    }

    return ['DEPLOY_CPANEL_TOKEN' => $match[1]];
}

/**
 * The settings the FTP upload needs that are not in the environment yet. They come from DEPLOY_FTP_HOST,
 * DEPLOY_FTP_USER and DEPLOY_FTP_PASSWORD, or else from the "FTP host:", "FTP user:" and "FTP password:"
 * lines of local/keys.md. The password is never printed.
 *
 * @return array<string, string>
 */
function ftp_env(): array
{
    $keys = (string) @file_get_contents(root('local/keys.md'));
    $env = [];
    foreach (['HOST' => 'host', 'USER' => 'user', 'PASSWORD' => 'password'] as $name => $label) {
        if (getenv("DEPLOY_FTP_$name")) {
            continue;
        }
        // The password may hold spaces, so it runs to the end of its line.
        preg_match("/^FTP $label:[ \\t]*(\\S.*?)[ \\t]*\\r?$/m", $keys, $match)
            || fail("Set DEPLOY_FTP_$name, or add an \"FTP $label: ...\" line to local/keys.md.");
        $env["DEPLOY_FTP_$name"] = $match[1];
    }

    return $env;
}

/**
 * Runs a script from deploy/ that talks to the host, through the cPanel API or FTP. On Windows it runs in a
 * container: Git for Windows' curl stalls on large uploads (see docs/architecture/deployment.md). Docker must be
 * running.
 *
 * @param  list<string>  $args
 * @param  string  $files  folder with the files the arguments name; the script runs in it
 * @param  array<string, string>  $env
 */
function run_cpanel_script(string $script, array $args, string $files, array $env, bool $dryRun = false): void
{
    if (PHP_OS_FAMILY === 'Windows') {
        $command = ['docker', 'run', '--rm', '-w', '/pkg'];
        $names = [
            'DEPLOY_CPANEL_TOKEN', 'DEPLOY_CPANEL_USER', 'DEPLOY_CPANEL_URL',
            'DEPLOY_FTP_HOST', 'DEPLOY_FTP_USER', 'DEPLOY_FTP_PASSWORD', 'DEPLOY_FTP_INSECURE',
            'APP_DIR', 'WEB_DIR', 'TARGET_VHOST', 'TARGET_PHP', 'TARGET_URL', 'DEPLOY_APP_DIR_PATTERN', 'DEPLOY_REFUSE_IF_PRESENT', 'DEPLOY_REPLACE_ENV',
        ];
        foreach ($names as $name) {
            if (isset($env[$name]) || getenv($name) !== false) {
                array_push($command, '-e', $name);
            }
        }
        array_push($command, '-v', core_root('deploy').':/deploy:ro', '-v', $files.':/pkg:ro', 'alpine:3', 'sh', '-c',
            'apk add -q --no-cache bash curl jq unzip coreutils >/dev/null && bash /deploy/'.$script.' "$@"', 'sh', ...$args);
        $cwd = root();
    } else {
        $command = ['bash', core_root('deploy/'.$script), ...$args];
        $cwd = $files;
    }

    if ($dryRun) {
        echo 'Would run: '.implode(' ', $command).PHP_EOL;

        return;
    }
    run($command, $cwd, $env);
}

function remove_dir(string $dir): void
{
    if (! is_dir($dir)) {
        return;
    }
    $items = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS),
        RecursiveIteratorIterator::CHILD_FIRST,
    );
    foreach ($items as $item) {
        $item->isDir() && ! $item->isLink() ? rmdir($item->getPathname()) : unlink($item->getPathname());
    }
    rmdir($dir);
}

function make_dir(string $dir): void
{
    if (! is_dir($dir) && ! mkdir($dir, 0777, true)) {
        fail("Could not create $dir");
    }
}
