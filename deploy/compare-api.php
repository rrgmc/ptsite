<?php

/*
 * Compares the API answers of two running copies of the site, read-only. Use it before a site moves to a new
 * version of the code: start both versions on copies of the same database and check that they answer alike.
 *
 *   php deploy/compare-api.php <url A> <url B> --user <username> [--password <password>] [--show <n>]
 *
 * - The URLs are the sites' addresses, such as http://127.0.0.1:8000. The login must work on both.
 * - The password comes from --password or, better, from COMPARE_API_PASSWORD, so it is not on a command line.
 * - It logs in for a token, then reads every list and every season, night and player, with GET only.
 * - It prints one line per address that differs, and never the data itself. --show <n> also prints the names
 *   of the first n fields that differ in each answer.
 * - "me" and the audit log name the token and the login, so they are compared without those fields.
 */

$args = $argv;
array_shift($args);
$options = ['user' => null, 'password' => getenv('COMPARE_API_PASSWORD') ?: null, 'show' => 0];
$urls = [];
while ($args !== []) {
    $arg = array_shift($args);
    if (in_array($arg, ['--user', '--password', '--show'], true)) {
        $options[substr($arg, 2)] = array_shift($args);
    } else {
        $urls[] = rtrim($arg, '/');
    }
}
if (count($urls) !== 2 || ! $options['user'] || ! $options['password']) {
    fwrite(STDERR, "Usage: php deploy/compare-api.php <url A> <url B> --user <username> [--password <password>] [--show <n>]\n");
    exit(2);
}

/** @return array{int, mixed} the status and the decoded JSON body */
function request(string $url, ?string $token = null, ?array $post = null): array
{
    $headers = ['Accept: application/json'];
    if ($token !== null) {
        $headers[] = "Authorization: Bearer {$token}";
    }
    $http = ['method' => 'GET', 'ignore_errors' => true, 'timeout' => 120];
    if ($post !== null) {
        $http['method'] = 'POST';
        $http['content'] = json_encode($post);
        $headers[] = 'Content-Type: application/json';
    }
    $http['header'] = implode("\r\n", $headers);
    $body = @file_get_contents($url, false, stream_context_create(['http' => $http]));
    if ($body === false) {
        fwrite(STDERR, "No answer from {$url}\n");
        exit(2);
    }
    preg_match('/\s(\d{3})\s/', $http_response_header[0] ?? '', $match);

    return [(int) ($match[1] ?? 0), json_decode($body, true)];
}

function token(string $base, string $user, string $password): string
{
    [$status, $body] = request("{$base}/api/v1/tokens", null, ['username' => $user, 'password' => $password, 'device_name' => 'compare-api']);
    $token = $body['token'] ?? $body['data']['token'] ?? null;
    if ($status >= 300 || ! is_string($token)) {
        fwrite(STDERR, "Could not log in to {$base} (HTTP {$status}).\n");
        exit(2);
    }

    return $token;
}

/** The fields of an answer that differ, as paths such as "data.3.points". */
function differences(mixed $a, mixed $b, string $path = ''): array
{
    if (is_array($a) && is_array($b)) {
        $found = [];
        foreach (array_unique([...array_keys($a), ...array_keys($b)]) as $key) {
            $at = $path === '' ? (string) $key : "{$path}.{$key}";
            if (! array_key_exists($key, $a) || ! array_key_exists($key, $b)) {
                $found[] = $at.(array_key_exists($key, $a) ? ' (only in A)' : ' (only in B)');
            } else {
                array_push($found, ...differences($a[$key], $b[$key], $at));
            }
        }

        return $found;
    }

    return $a === $b ? [] : [$path];
}

[$a, $b] = $urls;
$tokens = [$a => token($a, $options['user'], $options['password']), $b => token($b, $options['user'], $options['password'])];
$get = fn (string $base, string $path) => request("{$base}/api/v1/{$path}", $tokens[$base]);

// The ids come from A. An id missing in B shows up as a difference.
$ids = fn (string $path) => array_column($get($a, $path)[1]['data'] ?? [], 'id');
$seasons = $ids('seasons');
$players = $ids('players?archived=1') ?: $ids('players');

$paths = ['me', 'seasons', 'seasons/current', 'places', 'players', 'holidays', 'statistics', 'audit-log'];
foreach ([(int) date('Y') - 1, (int) date('Y'), (int) date('Y') + 1] as $year) {
    $paths[] = "holiday-calendar/{$year}";
}
$nights = [];
foreach ($seasons as $season) {
    array_push($paths, "seasons/{$season}", "seasons/{$season}/standings", "seasons/{$season}/nights", "seasons/{$season}/calendar",
        "seasons/{$season}/night-suggestions", "statistics?season_id={$season}");
    array_push($nights, ...array_column($get($a, "seasons/{$season}/nights")[1]['data'] ?? [], 'id'));
}
foreach ($nights as $night) {
    array_push($paths, "nights/{$night}", "nights/{$night}/attendance");
}
foreach ($players as $player) {
    array_push($paths, "players/{$player}", "players/{$player}/statistics");
}

// Fields that name this run's own login or token, or the moment of the request.
$ignored = ['me' => ['data.current_token', 'data.last_login_at'], 'audit-log' => null];

$different = 0;
foreach ($paths as $path) {
    [$statusA, $bodyA] = $get($a, $path);
    [$statusB, $bodyB] = $get($b, $path);
    if ($path === 'audit-log') {
        // The two logins of this run are the newest entries on each side, and differ.
        $strip = fn ($body) => array_values(array_filter($body['data'] ?? [], fn ($row) => ($row['action'] ?? '') !== 'auth.token_created'));
        $bodyA = ['count' => count($strip($bodyA))];
        $bodyB = ['count' => count($strip($bodyB))];
    }
    $found = $statusA !== $statusB ? ["HTTP {$statusA} and {$statusB}"] : differences($bodyA, $bodyB);
    $found = array_values(array_filter($found, fn ($at) => ! in_array($at, $ignored[$path] ?? [], true)));
    if ($found !== []) {
        $different++;
        echo "DIFFERENT {$path}: ".count($found)." fields\n";
        foreach (array_slice($found, 0, (int) $options['show']) as $at) {
            echo "    {$at}\n";
        }
    }
}

echo count($paths).' addresses compared, '.$different." different.\n";
exit($different === 0 ? 0 : 1);
