<?php

/*
 * Fails when a file of this repository names a real site, host or person. This repository is the shared core:
 * it must hold no site's name, no deployment target and no member of a real league.
 *
 * Usage: php deploy/check-forbidden.php [--list <file>]
 *
 * It reads every file git knows or would add (tracked, plus untracked and not ignored).
 *
 * - **This script names no word itself.** The words come from the file given with --list (or
 *   PTSITE_FORBIDDEN_FILE): one word or phrase per line. That file belongs to a site, which knows its own
 *   names, and is never committed here. A site runs this check on the core with its list.
 * - A plain entry matches whole words only, in file names and contents. An entry shorter than five letters
 *   must also match the capitals.
 * - An entry that starts with "*" matches anywhere, also inside a longer word, whatever the capitals: "*liga"
 *   finds "ligademo". Use it for a site's name and its host.
 * - deploy/forbidden-allow.txt lists exceptions, one per line: "<path>: <word>", or "<word>" for every file.
 * - An image is refused unless deploy/forbidden-allow.txt lists its path. This part needs no list.
 * - Lock files name the authors of other people's packages. Only the "*" entries are searched in them.
 */

const IMAGES = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'bmp', 'ico'];
const LOCK_FILES = ['composer.lock', 'package-lock.json'];

$root = dirname(__DIR__);
chdir($root);

$options = getopt('', ['list:']);
$listFile = $options['list'] ?? (getenv('PTSITE_FORBIDDEN_FILE') ?: null);

/** @return list<string> */
function lines(string $file): array
{
    $lines = array_map('trim', file($file, FILE_IGNORE_NEW_LINES) ?: []);

    return array_values(array_filter($lines, fn (string $line) => $line !== '' && ! str_starts_with($line, '#')));
}

$entries = [];
if ($listFile !== null) {
    if (! is_file($listFile)) {
        fwrite(STDERR, "check-forbidden: no such list: {$listFile}\n");
        exit(2);
    }
    $entries = lines($listFile);
}

$allowEverywhere = [];
$allowByPath = [];
$allowedImages = [];
if (is_file('deploy/forbidden-allow.txt')) {
    foreach (lines('deploy/forbidden-allow.txt') as $line) {
        if (preg_match('/^(\S+):\s+(.+)$/u', $line, $m)) {
            $allowByPath[$m[1]][] = mb_strtolower($m[2]);
        } elseif (in_array(strtolower(pathinfo($line, PATHINFO_EXTENSION)), IMAGES, true)) {
            $allowedImages[] = $line;
        } else {
            $allowEverywhere[] = mb_strtolower($line);
        }
    }
}

exec('git ls-files --cached --others --exclude-standard -z', $output, $status);
if ($status !== 0) {
    fwrite(STDERR, "check-forbidden: git ls-files failed\n");
    exit(2);
}
$files = array_values(array_filter(explode("\0", implode("\n", $output))));

/** @var array<string, array{pattern: string, anywhere: bool}> $words the entry as written, without its "*" */
$words = [];
foreach ($entries as $entry) {
    $anywhere = str_starts_with($entry, '*');
    $word = $anywhere ? ltrim(substr($entry, 1)) : $entry;
    if ($word === '') {
        continue;
    }
    $quoted = preg_quote($word, '/');
    $words[$word] = [
        'anywhere' => $anywhere,
        'pattern' => $anywhere
            ? "/{$quoted}/iu"
            : '/(?<![\p{L}\p{N}])'.$quoted.'(?![\p{L}\p{N}])/'.(mb_strlen($word) < 5 ? 'u' : 'iu'),
    ];
}

$problems = [];
foreach ($files as $path) {
    if (! is_file($path)) {
        continue;
    }
    $allowed = [...$allowEverywhere, ...($allowByPath[$path] ?? [])];
    $isImage = in_array(strtolower(pathinfo($path, PATHINFO_EXTENSION)), IMAGES, true);
    if ($isImage && ! in_array($path, $allowedImages, true)) {
        $problems[] = "{$path}: an image that deploy/forbidden-allow.txt does not list";
    }

    $subjects = ['name' => $path];
    if (! $isImage) {
        $content = (string) file_get_contents($path);
        // A binary file has nothing to read.
        if (! str_contains(substr($content, 0, 8000), "\0")) {
            $subjects['content'] = $content;
        }
    }

    $isLockFile = in_array(basename($path), LOCK_FILES, true);
    foreach ($words as $word => ['pattern' => $pattern, 'anywhere' => $anywhere]) {
        if (($isLockFile && ! $anywhere) || in_array(mb_strtolower((string) $word), $allowed, true)) {
            continue;
        }
        foreach ($subjects as $where => $subject) {
            if (@preg_match($pattern, $subject, $m, PREG_OFFSET_CAPTURE) === 1) {
                $line = $where === 'content' ? substr_count($subject, "\n", 0, $m[0][1]) + 1 : 0;
                $problems[] = $where === 'content' ? "{$path}:{$line}: \"{$word}\"" : "{$path}: \"{$word}\" in the file name";
            }
        }
    }
}

if ($problems === []) {
    $what = $words === [] ? 'no list of words given, images checked' : count($words).' words';
    echo 'check-forbidden: '.count($files)." files, {$what}, nothing found.\n";
    exit(0);
}

sort($problems);
echo implode("\n", $problems)."\n";
fwrite(STDERR, 'check-forbidden: '.count($problems)." problems.\n");
exit(1);
