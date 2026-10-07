<?php

/*
 * Fails when a file of this repository names a real site, host or person. This repository is the shared core:
 * it must hold no site's name, no deployment target and no real player.
 *
 * Usage: php deploy/check-forbidden.php [--list <file>]
 *
 * It reads every file git knows or would add (tracked, plus untracked and not ignored).
 *
 * - The words below are searched in file names and contents, whatever their capitals, also inside longer words.
 * - --list (or PTSITE_FORBIDDEN_FILE) names a file with one more word or phrase per line, such as the names
 *   of a site's real players. That file belongs to a site and is never committed here. Its entries match
 *   whole words only. An entry shorter than five letters must also match the capitals.
 * - deploy/forbidden-allow.txt lists exceptions, one per line: "<path>: <word>", or "<word>" for every file.
 * - An image is refused unless deploy/forbidden-allow.txt lists its path.
 */

const BUILT_IN = ['tlpt', 'little poker table', 'hostgator', 'aptclub', 'rangel', 'sibit', 'br578'];
const IMAGES = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'bmp', 'ico'];
const SELF = ['deploy/check-forbidden.php'];
// Lock files name the authors of other people's packages. Only the words above are searched in them.
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

$extra = [];
if ($listFile !== null) {
    if (! is_file($listFile)) {
        fwrite(STDERR, "check-forbidden: no such list: {$listFile}\n");
        exit(2);
    }
    $extra = lines($listFile);
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

/** A pattern that finds the entry as whole words. */
function wholeWord(string $entry): string
{
    $flags = mb_strlen($entry) < 5 ? 'u' : 'iu';

    return '/(?<![\p{L}\p{N}])'.preg_quote($entry, '/').'(?![\p{L}\p{N}])/'.$flags;
}

$patterns = [];
foreach (BUILT_IN as $word) {
    $patterns[$word] = '/'.preg_quote($word, '/').'/iu';
}
foreach ($extra as $entry) {
    $patterns[$entry] ??= wholeWord($entry);
}

$problems = [];
foreach ($files as $path) {
    if (! is_file($path) || in_array($path, SELF, true)) {
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
    foreach ($patterns as $entry => $pattern) {
        if ($isLockFile && ! in_array($entry, BUILT_IN, true)) {
            continue;
        }
        if (in_array(mb_strtolower((string) $entry), $allowed, true)) {
            continue;
        }
        foreach ($subjects as $where => $subject) {
            if (@preg_match($pattern, $subject, $m, PREG_OFFSET_CAPTURE) === 1) {
                $line = $where === 'content' ? substr_count($subject, "\n", 0, $m[0][1]) + 1 : 0;
                $problems[] = $where === 'content' ? "{$path}:{$line}: \"{$entry}\"" : "{$path}: \"{$entry}\" in the file name";
            }
        }
    }
}

if ($problems === []) {
    echo 'check-forbidden: '.count($files).' files, '.count($patterns)." words, nothing found.\n";
    exit(0);
}

sort($problems);
echo implode("\n", $problems)."\n";
fwrite(STDERR, 'check-forbidden: '.count($problems)." problems.\n");
exit(1);
