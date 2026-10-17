<?php

// Moves a site's core submodule to a release of the core, through a pull request. See docs/new-site.md
// ("A new version of the core").
//
//   php core/deploy/move-core.php <tag> [--summary "<text>"] [--yes] [--dry-run]
//
// - It runs in a site's repository (PTSITE_PROJECT_ROOT), never in the core's.
// - It makes the commit "Move the core to <tag>[, <summary>]" on top of origin/master, on the branch
//   core-<tag>. It writes the commit with git's plumbing, so no file of a checkout changes.
// - It pushes the branch, opens the pull request, waits for its checks and merges it. When a check fails it
//   stops and leaves the pull request open.
// - It refuses when the core's backend/composer.json changed between the two tags: the site's composer.lock
//   then needs `composer update`, which this script does not do.
// - It asks before pushing, unless --yes is given. --dry-run does every check and pushes nothing.

require __DIR__.'/lib.php';

/**
 * Runs git in the project with $input on standard input and returns its output, stopping the script when
 * git fails.
 */
function git_input(string $input, string ...$args): string
{
    $process = proc_open(['git', '-C', root(), ...$args], [['pipe', 'r'], ['pipe', 'w'], STDERR], $pipes);
    is_resource($process) || fail('Could not start git.');
    fwrite($pipes[0], $input);
    fclose($pipes[0]);
    $output = trim((string) stream_get_contents($pipes[1]));
    $code = proc_close($process);
    $code === 0 || fail('Failed ('.$code.'): git '.implode(' ', $args));

    return $output;
}

/** Runs a command with its output shown and returns its exit code. */
function run_code(array $command): int
{
    $process = proc_open($command, [STDIN, STDOUT, STDERR], $pipes, root());

    return is_resource($process) ? proc_close($process) : 1;
}

$tag = null;
$summary = null;
$yes = false;
$dryRun = false;
$args = array_slice($argv, 1);
while ($args !== []) {
    $arg = array_shift($args);
    match (true) {
        $arg === '--yes' => $yes = true,
        $arg === '--dry-run' => $dryRun = true,
        $arg === '--summary' => $summary = array_shift($args) ?? fail('--summary needs a text.'),
        str_starts_with($arg, '-') => fail("Unknown option $arg"),
        default => $tag = $arg,
    };
}
if ($tag === null || ! preg_match('/^v?(\d+\.\d+\.\d+)$/', $tag, $match)) {
    fail('Give the core\'s release as vX.Y.Z, for example: task core:move -- v1.25.0');
}
$tag = 'v'.$match[1];
is_site() || fail('This moves the core of a site repository. Set PTSITE_PROJECT_ROOT, or run it with task core:move in the site.');

$branch = "core-$tag";
$subject = "Move the core to $tag".($summary !== null && $summary !== '' ? ", $summary" : '');

// The core's tags, fetched into the submodule of this checkout.
is_dir(root('core')) && git('-C', 'core', 'rev-parse', '--git-dir')[0] === 0
    || fail('The core is not checked out in core/. Run git submodule update --init core first.');
git_output('fetch', '--quiet', 'origin', 'master');
git_output('-C', 'core', 'fetch', '--quiet', '--tags', 'origin');

$base = git_output('rev-parse', 'origin/master');
$pinned = git_output('rev-parse', 'origin/master:core');
[$code, $target] = git('-C', 'core', 'rev-parse', '--verify', '--quiet', "$tag^{commit}");
$code === 0 || fail("The core has no tag $tag.");
$target !== $pinned || fail("master already pins the core at $tag.");
[$code] = git('-C', 'core', 'merge-base', '--is-ancestor', $target, $pinned);
$code !== 0 || fail("$tag is older than the core master pins. Move the core back by hand, through a pull request.");
[$code, $from] = git('-C', 'core', 'describe', '--tags', '--exact-match', $pinned);
$from = $code === 0 ? $from : substr($pinned, 0, 7);

git('-C', 'core', 'diff', '--quiet', $pinned, $target, '--', 'backend/composer.json')[0] === 0
    || fail("The core's backend/composer.json changed from $from to $tag. Move the core by hand, with composer update in backend/ (docs/new-site.md).");
git_output('ls-remote', '--heads', 'origin', "refs/heads/$branch") === ''
    || fail("The branch $branch is on GitHub already. Finish or delete its pull request first.");
[$code] = git('rev-parse', '--verify', '--quiet', "refs/heads/$branch");
$code !== 0 || fail("The branch $branch exists here already. Delete it first: git branch -D $branch");

// The tree of origin/master with the core's entry pointing to the new commit. The core is at the top of the
// tree, so only that level changes.
$tree = preg_replace(
    '/^160000 commit [0-9a-f]+\tcore$/m',
    "160000 commit $target\tcore",
    git_output('ls-tree', 'origin/master'),
    -1,
    $count,
);
$count === 1 || fail('origin/master has no submodule named core at the top of its tree.');

echo "Moves the core from $from to $tag on top of origin/master (".substr($base, 0, 7).").\n";
echo "Commit: $subject\n";
echo "Then: push $branch, open its pull request, wait for its checks and merge it.\n";
if ($dryRun) {
    echo "Dry run: nothing was committed or pushed.\n";
    exit(0);
}
if (! $yes) {
    echo 'Push and open the pull request? [y/N] ';
    $answer = fgets(STDIN);
    if ($answer === false || strtolower(trim($answer)) !== 'y') {
        fail('Nothing pushed. Give --yes to skip the question.');
    }
}

$treeId = git_input($tree."\n", 'mktree');
$commit = git_input($subject."\n", 'commit-tree', $treeId, '-p', $base);
git_output('push', '--quiet', 'origin', "$commit:refs/heads/$branch");

// The pull request quotes the core's release notes, when the core's repository is on GitHub.
$body = "Moves the core from $from to $tag. Only the submodule changes.";
$url = git_output('config', '-f', '.gitmodules', 'submodule.core.url');
if (preg_match('#github\.com[:/]([^/]+/[^/]+?)(\.git)?$#', $url, $repo)) {
    [$code, $notes] = gh('release', 'view', $tag, '--repo', $repo[1], '--json', 'body', '--jq', '.body');
    $code === 0 && $notes !== '' && $body .= "\n\n## The core's release notes\n\n$notes";
}
$pull = gh_output('pr', 'create', '--base', 'master', '--head', $branch, '--title', $subject, '--body', $body);
echo "Opened $pull\n";

// GitHub starts the checks a few seconds after the pull request opens.
for ($try = 0; $try < 24; $try++) {
    [, $checks] = gh('pr', 'checks', $pull, '--json', 'name');
    if ($checks !== '' && $checks !== '[]') {
        break;
    }
    sleep(5);
}
if ($checks === '' || $checks === '[]') {
    fail("No check started on $pull after two minutes. Look at it, and merge it by hand when it is right.");
}
run_code(['gh', 'pr', 'checks', $pull, '--watch', '--fail-fast']) === 0
    || fail("A check failed. The pull request is still open: $pull");

run_code(['gh', 'pr', 'merge', $pull, '--merge', '--delete-branch', '--subject', "Merge the core $tag into master"]) === 0
    || fail("The merge failed. The pull request is still open: $pull");
echo "Merged. Bring this checkout up to date: git pull && git submodule update core\n";
echo "Then release it, if it should go live: task release -- <next version> --dry-run\n";
