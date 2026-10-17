<?php

// Releases a version: tags master's latest commit and pushes the tag. See RELEASE.md.
//
//   php deploy/release.php <version> [--dry-run]
//
// - <version> is X.Y.Z, with or without the leading "v": 2.1.0 and v2.1.0 both make the tag v2.1.0.
// - The tag is the version. No file holds the number, so nothing is committed and master is never pushed.
// - The tag push starts .github/workflows/release.yml, which builds the package and the GitHub release.
// - It refuses a commit whose pull request has a check that is running or did not pass. It needs gh, the
//   GitHub CLI, signed in.
// - --dry-run does every check and prints the tag and push commands instead of running them.

require __DIR__.'/lib.php';

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

// CI runs on the pull request, not on master, so the checks to look at are those of the branch the pull
// request merged. A change that runs no check, such as one to docs only, passes.
$pullHead = gh_output('api', "repos/{owner}/{repo}/commits/$head/pulls", '--jq', '[.[] | select(.merged_at != null) | .head.sha][0] // ""');
$pullHead !== '' || fail('master\'s latest commit did not come through a merged pull request.');
$checks = gh_output('api', "repos/{owner}/{repo}/commits/$pullHead/check-runs?per_page=100", '--jq', '.check_runs[] | [.name, .status, .conclusion // ""] | @tsv');
foreach (array_filter(explode("\n", $checks)) as $line) {
    [$name, $status, $conclusion] = explode("\t", $line) + ['', '', ''];
    $status === 'completed' || fail("The check \"$name\" of the merged pull request has not finished. Wait for it, then release.");
    in_array($conclusion, ['success', 'skipped', 'neutral'], true)
        || fail("The check \"$name\" of the merged pull request did not pass ($conclusion). Fix it through a new pull request first.");
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
