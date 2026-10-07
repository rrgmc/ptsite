<?php

// Extracts an uploaded deploy package on the shared host. FTP can put files there but cannot extract a zip, so
// deploy/ftp-upload.sh uploads this file into the site's document root under a random name, with a random
// token and the names below in place of the placeholders. It calls the file once and deletes it again.
//
// - The package zip is in the app folder, which is next to the document root. It is extracted there.
// - The web zip is in the document root. It is extracted there.
// - Both zips are removed, also when extracting fails.
//
// The answer is text. A line "APP <path>" gives the app folder's full path, which FTP cannot tell. The last
// line is "EXIT <code>", 0 when both zips were extracted.

const TOKEN = '__DEPLOY_TOKEN__';
const APP_DIR_NAME = '__APP_DIR_NAME__';
const PACKAGE_ZIP = '__PACKAGE_ZIP__';
const WEB_ZIP = '__WEB_ZIP__';

// Without the right token the file answers like a missing page. The placeholder itself is too short to pass.
if (strlen(TOKEN) < 32 || ! hash_equals(TOKEN, $_SERVER['HTTP_X_DEPLOY_TOKEN'] ?? '')) {
    http_response_code(404);
    exit;
}

set_time_limit(0);
header('Content-Type: text/plain; charset=utf-8');

$app = str_replace('\\', '/', dirname(__DIR__)).'/'.APP_DIR_NAME;
$code = 0;
foreach ([[$app.'/'.PACKAGE_ZIP, $app], [__DIR__.'/'.WEB_ZIP, __DIR__]] as [$file, $into]) {
    $zip = new ZipArchive;
    if ($zip->open($file, ZipArchive::RDONLY) !== true) {
        echo "Could not open $file".PHP_EOL;
        $code = 1;
    } else {
        $count = $zip->numFiles;
        if ($zip->extractTo($into)) {
            echo "Extracted $count files into $into".PHP_EOL;
        } else {
            echo "Could not extract $file: ".$zip->getStatusString().PHP_EOL;
            $code = 1;
        }
        $zip->close();
    }
    @unlink($file);
}

// PHP may still hold the old code of the files that were just replaced.
function_exists('opcache_reset') && opcache_reset();

echo 'APP '.$app.PHP_EOL;
echo PHP_EOL.'EXIT '.$code.PHP_EOL;
