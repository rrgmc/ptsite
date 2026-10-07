<?php

// Prepares a new git worktree, which starts without any of the files git ignores.
//
//   php deploy/worktree-init.php        (run it through `task worktree:init`, which then runs `task setup`)
//
// - Copies the ignored files that cannot be recreated from the main checkout: the deploy token, the machine
//   notes for coding assistants, and the backend's .env. It never replaces a file that is already there.
// - Picks a port offset no other worktree uses and writes it to local/ports.env, so this worktree's servers and
//   tests do not collide with another one's (see frontend/ports.ts). The main checkout has none, so offset 0.
// - Gives this worktree its own database on the shared MySQL server: DB_DATABASE=ptsite_<offset> in the .env.
// - Puts this worktree's ports in the .env lines that name a port: SANCTUM_STATEFUL_DOMAINS and APP_URL.

require __DIR__.'/lib.php';

const ENV_FILE = 'backend/.env';
const COPIED = ['local/keys.md', 'local/deploy.env', 'CLAUDE.local.md', ENV_FILE];
const PORTS_FILE = 'local/ports.env';
const MAIN_DATABASE = 'ptsite';

function port_offset(string $checkout): ?int
{
    $text = @file_get_contents("$checkout/".PORTS_FILE);

    return $text !== false && preg_match('/^PORT_OFFSET=(\d+)/m', $text, $match) ? (int) $match[1] : null;
}

$list = shell_exec('git -C '.escapeshellarg(root()).' worktree list --porcelain');
preg_match_all('/^worktree (.+)$/m', (string) $list, $matches);
$checkouts = array_map(fn (string $path) => str_replace('\\', '/', trim($path)), $matches[1]);
$main = $checkouts[0] ?? fail('Could not list the worktrees. Is this a git checkout?');

if (strcasecmp($main, root()) === 0) {
    fail('This is the main checkout, not a worktree. Use `task setup` here.');
}

foreach (COPIED as $file) {
    if (is_file(root($file))) {
        echo "Kept   $file\n";
    } elseif (is_file("$main/$file")) {
        make_dir(dirname(root($file)));
        copy("$main/$file", root($file)) || fail("Could not copy $file");
        echo "Copied $file\n";
    } else {
        echo "No     $file in the main checkout\n";
    }
}

$offset = port_offset(root());
if ($offset === null) {
    $used = array_filter(array_map(port_offset(...), $checkouts), fn (?int $o) => $o !== null);
    for ($offset = 100; in_array($offset, $used, true); $offset += 100);
    make_dir(root('local'));
    file_put_contents(root(PORTS_FILE), "# Written by `task worktree:init`. See frontend/ports.ts.\nPORT_OFFSET=$offset\n");
}
printf("Port offset %d: Laravel on :%d, Vite on :%d\n", $offset, 8000 + $offset, 5173 + $offset);

// The MySQL server is shared (compose.yaml), so the copied .env still names the main checkout's database.
$env = @file_get_contents(root(ENV_FILE));
if ($env !== false && preg_match('/^DB_DATABASE=(\w+)\r?$/m', $env, $match)) {
    $database = MAIN_DATABASE."_$offset";
    if ($match[1] === MAIN_DATABASE) {
        file_put_contents(root(ENV_FILE), preg_replace('/^DB_DATABASE=\w+(\r?)$/m', "DB_DATABASE=$database\$1", $env));
    }
    printf("Database %s\n", $match[1] === MAIN_DATABASE ? $database : $match[1].' (kept)');
} else {
    echo 'No DB_DATABASE line in '.ENV_FILE.": set the MySQL settings there, see backend/.env.example\n";
}

// The copied .env trusts the main checkout's Vite port. Without this worktree's port, logging in through its
// Vite server fails with "Session store not set on request."
$env = @file_get_contents(root(ENV_FILE));
if ($env !== false && preg_match('/^SANCTUM_STATEFUL_DOMAINS=.*:5173\b/m', $env)) {
    $vite = 5173 + $offset;
    file_put_contents(root(ENV_FILE), preg_replace_callback(
        '/^SANCTUM_STATEFUL_DOMAINS=.*$/m',
        fn (array $line) => preg_replace('/:5173\b/', ":$vite", $line[0]),
        $env,
    ));
    echo "Sanctum trusts the Vite server on :$vite\n";
}

// The password link in an email is built from APP_URL, so it must open this worktree's server.
$env = @file_get_contents(root(ENV_FILE));
if ($env !== false && preg_match('/^APP_URL=.*:8000\b/m', $env)) {
    $laravel = 8000 + $offset;
    file_put_contents(root(ENV_FILE), preg_replace_callback(
        '/^APP_URL=.*$/m',
        fn (array $line) => preg_replace('/:8000\b/', ":$laravel", $line[0]),
        $env,
    ));
    echo "APP_URL names the Laravel server on :$laravel\n";
}
