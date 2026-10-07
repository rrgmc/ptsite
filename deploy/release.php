<?php

// Releases a version: tags master's latest commit and pushes the tag. See RELEASE.md.
//
//   php deploy/release.php <version> [--dry-run]
//
// - <version> is X.Y.Z, with or without the leading "v": 2.1.0 and v2.1.0 both make the tag v2.1.0.
// - The tag is the version. No file holds the number, so nothing is committed and master is never pushed.
// - The tag push starts .github/workflows/release.yml, which builds the package and the GitHub release.
// - --dry-run does every check and prints the tag and push commands instead of running them.

require __DIR__.'/lib.php';

/**
 * Runs git and returns its exit code and output.
 *
 * @return array{int, string}
 */
function git(string ...$args): array
{
    $process = proc_open(['git', '-C', root(), ...$args], [STDIN, ['pipe', 'w'], STDERR], $pipes);
    is_resource($process) || fail('Could not start git.');
    $output = trim((string) stream_get_contents($pipes[1]));

    return [proc_close($process), $output];
}

/** Git's output, stopping the script when git fails. */
function git_output(string ...$args): string
{
    [$code, $output] = git(...$args);
    $code === 0 || fail('Failed ('.$code.'): git '.implode(' ', $args));

    return $output;
}

$version = null;
$dryRun = false;
foreach (array_slice($argv, 1) as $arg) {
    match (true) {
        $arg === '--dry-run' => $dryRun = true,
        str_starts_with($arg, '-') => fail("Unknown option $arg"),
        default => $version = $arg,
    };
}
if ($version === null || ! preg_match('/^v?(\d+\.\d+\.\d+)$/', $version, $match)) {
    fail('Give the version as X.Y.Z, for example: task release -- 2.1.0');
}
$version = $match[1];
$tag = 'v'.$version;

git_output('fetch', '--quiet', '--tags', 'origin', 'master');

git_output('status', '--porcelain') === '' || fail('The working tree has changes. Commit or remove them first.');
$branch = git_output('rev-parse', '--abbrev-ref', 'HEAD');
$branch === 'master' || fail("A release is made from master, and this is $branch.");
$head = git_output('rev-parse', 'HEAD');
$head === git_output('rev-parse', 'origin/master')
    || fail('master here is not the master on GitHub. Run "git pull" first, and merge local commits through a pull request.');

$tags = array_filter(explode("\n", git_output('tag', '--list', 'v*.*.*')));
if (in_array($tag, $tags, true) || git_output('ls-remote', '--tags', 'origin', "refs/tags/$tag") !== '') {
    fail("The tag $tag exists already. A published tag is never moved: release the next version instead.");
}
usort($tags, fn (string $a, string $b) => version_compare(ltrim($b, 'v'), ltrim($a, 'v')));
$latest = $tags[0] ?? null;
if ($latest !== null && version_compare($version, ltrim($latest, 'v'), '<=')) {
    fail("$tag is not above the latest release, $latest.");
}
if ($latest !== null && git_output('rev-parse', "$latest^{commit}") === $head) {
    fail("This commit is already released as $latest.");
}

$commands = [
    ['tag', '-a', $tag, '-m', $version],
    ['push', 'origin', $tag],
];
foreach ($commands as $command) {
    if ($dryRun) {
        echo 'Would run: git '.implode(' ', $command).PHP_EOL;

        continue;
    }
    git_output(...$command);
}

printf("%s %s on %s%s.\n", $dryRun ? 'Would release' : 'Released', $tag, substr($head, 0, 7), $latest ? ", after $latest" : ', the first release');
$dryRun || print "The release workflow now builds the package: gh run watch, then gh release view $tag\n";
