<?php

// Builds the deploy package for shared hosting.
//
//   php deploy/build-package.php
//
// - Writes local/build/<name>.zip from the working tree, committed or not. The name is "packageName" of the
//   site's site.json, or else "ptsite".
// - Stages in local/build/stage, so the vendor folders keep their dev packages and public/app is not touched.
// - APP_VERSION names the version; without it the version comes from `git describe`.
//
// It builds one of two things:
//
// - **The core's own demo site**, when run in this repository: the package is backend/ here.
// - **A site**, when PTSITE_PROJECT_ROOT names a site's repository (its Taskfile sets it). That repository has
//   backend/ (a thin Laravel app that requires the core as a Composer package through a path repository),
//   site/ (its settings) and the core as a git submodule. The package is the site's backend/, with the core
//   package copied into its vendor folder.

require __DIR__.'/lib.php';

/** Copies a folder's tracked and new files into the stage, without its tests. Ignored files never enter it. */
function stage_files(string $checkout, string $folder, string $into): void
{
    $files = shell_exec('git -C '.escapeshellarg($checkout).' ls-files -z --cached --others --exclude-standard -- '.escapeshellarg($folder));
    foreach (array_filter(explode("\0", (string) $files)) as $file) {
        $relative = substr($file, strlen($folder) + 1);
        if (preg_match('#^tests/#', $relative) || ! is_file("$checkout/$file")) {
            continue;
        }
        make_dir(dirname("$into/$relative"));
        copy("$checkout/$file", "$into/$relative") || fail("Could not copy $file");
    }
}

function describe(string $checkout): string
{
    return trim((string) shell_exec('git -C '.escapeshellarg($checkout).' describe --tags --always --dirty'));
}

$siteDir = getenv('PTSITE_SITE_DIR') ?: root('site');
$siteFile = "$siteDir/site.json";
$site = json_decode((string) @file_get_contents($siteFile), true);
is_array($site) || fail("No site settings in $siteFile.");
$name = $site['packageName'] ?? 'ptsite';
preg_match('/^[a-z0-9][a-z0-9-]*$/', $name) || fail("\"packageName\" in $siteFile must be lowercase letters, digits and hyphens.");

$build = root('local/build');
$stage = $build.'/stage';
$zipFile = "$build/$name.zip";

remove_dir($stage);

// The app that is packaged. A site's path repository names the core as "../<core>/backend", so the stage
// keeps the two folders side by side under the same names.
if (is_site()) {
    $composer = json_decode((string) @file_get_contents(root('backend/composer.json')), true);
    $url = null;
    foreach ($composer['repositories'] ?? [] as $repository) {
        if (($repository['type'] ?? '') === 'path') {
            $url = $repository['url'];
        }
    }
    preg_match('#^\.\./([\w.-]+)/backend$#', (string) $url, $match)
        || fail('backend/composer.json must have a path repository such as "../core/backend".');
    $app = "$stage/backend";
    stage_files(root(), 'backend', $app);
    stage_files(core_root(), 'backend', "$stage/{$match[1]}/backend");
} else {
    $app = $stage;
    stage_files(core_root(), 'backend', $app);
}
is_file("$app/artisan") || fail('No backend files found. Is this a git checkout?');

// The site's settings go with the app: the backend reads them from its own folder on the server.
copy($siteFile, "$app/site.json") || fail("Could not copy $siteFile");

echo "Installing PHP packages without the dev ones...\n";
// Copies the core package into vendor/ where a path repository would link it: the package must stand alone.
run('composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist --no-progress', $app, ['COMPOSER_MIRROR_PATH_REPOS' => '1']);
if (is_site()) {
    is_link("$app/vendor/rrgmc/ptsite") && fail('The core package was linked into vendor/, not copied.');
    is_file("$app/vendor/rrgmc/ptsite/composer.json") || fail('The core package is not in vendor/.');
}

// A package added in another worktree is missing from this checkout's node_modules until it is installed here.
echo "Installing the frontend packages...\n";
run('npm ci --no-audit --no-fund', core_root('frontend'));

// The version the footer shows: APP_VERSION when given (the release workflow passes the tag), else what git
// says about the checkout. A site's version also names the core's: "v1.2.0+ptsite.v0.3.0". See RELEASE.md.
$version = getenv('APP_VERSION') ?: describe(root()) ?: 'dev';
$coreVersion = describe(core_root()) ?: 'dev';
if (is_site()) {
    $version .= '+ptsite.'.$coreVersion;
}

echo "Building the frontend, version $version...\n";
run('npx tsc -b', core_root('frontend'));
run('npx vite build --emptyOutDir --outDir '.escapeshellarg("$app/public/app"), core_root('frontend'), ['APP_VERSION' => $version, 'PTSITE_SITE_DIR' => $siteDir]);
// Served at /version.txt, to check which build a site runs.
file_put_contents("$app/public/version.txt", $version.PHP_EOL) || fail('Could not write version.txt');

echo "Zipping...\n";
@unlink($zipFile);
$zip = new ZipArchive;
$zip->open($zipFile, ZipArchive::CREATE) === true || fail("Could not create $zipFile");
$items = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($app, FilesystemIterator::SKIP_DOTS));
foreach ($items as $item) {
    $path = str_replace('\\', '/', substr($item->getPathname(), strlen($app) + 1));
    $zip->addFile($item->getPathname(), $path);
    // Windows has no Unix file modes, so set them: the host extracts the package on Linux.
    $zip->setExternalAttributesName($path, ZipArchive::OPSYS_UNIX, ($path === 'artisan' ? 0100755 : 0100644) << 16);
}
$count = $zip->numFiles;
$zip->close() || fail("Could not write $zipFile");

printf("%s: version %s, %d files, %.1f MB\n", $zipFile, $version, $count, filesize($zipFile) / 1048576);
