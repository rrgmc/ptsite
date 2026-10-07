<?php

// Builds the deploy package for shared hosting, like the CI "package" job (.github/workflows/ci.yml).
//
//   php deploy/build-package.php
//
// - Writes local/build/ptsite.zip from the working tree, committed or not.
// - APP_VERSION names the version; without it the version comes from `git describe`.
// - Stages in local/build/stage, so backend/vendor keeps its dev packages and backend/public/app is not touched.

require __DIR__.'/lib.php';

$build = root('local/build');
$stage = $build.'/stage';
$zipFile = $build.'/ptsite.zip';

remove_dir($stage);
make_dir($stage);

// Tracked and new files only: ignored ones (.env, SQLite files, vendor, logs, caches) never enter the package.
$files = shell_exec('git -C '.escapeshellarg(root()).' ls-files -z --cached --others --exclude-standard -- backend');
foreach (array_filter(explode("\0", (string) $files)) as $file) {
    $relative = substr($file, strlen('backend/'));
    if (preg_match('#^tests/#', $relative) || ! is_file(root($file))) {
        continue;
    }
    make_dir(dirname("$stage/$relative"));
    copy(root($file), "$stage/$relative") || fail("Could not copy $file");
}
is_file("$stage/artisan") || fail('No backend files found. Is this a git checkout?');

echo "Installing PHP packages without the dev ones...\n";
run('composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist --no-progress', $stage);

// A package added in another worktree is missing from this checkout's node_modules until it is installed here.
echo "Installing the frontend packages...\n";
run('npm ci --no-audit --no-fund', root('frontend'));

// The version the footer shows: APP_VERSION when given (the release workflow passes the tag), else what git
// says about this checkout. See RELEASE.md.
$version = getenv('APP_VERSION')
    ?: trim((string) shell_exec('git -C '.escapeshellarg(root()).' describe --tags --always --dirty'))
    ?: 'dev';

echo "Building the frontend, version $version...\n";
run('npx tsc -b', root('frontend'));
run('npx vite build --emptyOutDir --outDir '.escapeshellarg("$stage/public/app"), root('frontend'), ['APP_VERSION' => $version]);
// Served at /version.txt, to check which build a site runs.
file_put_contents("$stage/public/version.txt", $version.PHP_EOL) || fail('Could not write version.txt');

echo "Zipping...\n";
@unlink($zipFile);
$zip = new ZipArchive;
$zip->open($zipFile, ZipArchive::CREATE) === true || fail("Could not create $zipFile");
$items = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($stage, FilesystemIterator::SKIP_DOTS));
foreach ($items as $item) {
    $name = str_replace('\\', '/', substr($item->getPathname(), strlen($stage) + 1));
    $zip->addFile($item->getPathname(), $name);
    // Windows has no Unix file modes, so set them: the host extracts the package on Linux.
    $zip->setExternalAttributesName($name, ZipArchive::OPSYS_UNIX, ($name === 'artisan' ? 0100755 : 0100644) << 16);
}
$count = $zip->numFiles;
$zip->close() || fail("Could not write $zipFile");

printf("%s: version %s, %d files, %.1f MB\n", $zipFile, $version, $count, filesize($zipFile) / 1048576);
