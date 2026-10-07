<?php

/*
 * The table prefix (DB_TABLE_PREFIX, docs/architecture/overview.md). The query builder adds the prefix to a table
 * name; SQL written by hand does not get it. So the app writes no SQL that names a table. phpunit.xml sets a
 * prefix, so the whole Feature suite also proves that the app works with one.
 */

use PTSite\App\Support\TablePrefix;

it('writes no SQL by hand that could name a table', function () {
    // DatabaseCreator creates the database itself, which has no prefix.
    $allowed = ['Support'.DIRECTORY_SEPARATOR.'DatabaseCreator.php'];
    $forbidden = ['DB::raw(', 'DB::select(', 'DB::statement(', 'DB::unprepared(', 'selectRaw(', 'fromRaw(', 'joinRaw(', 'havingRaw(', 'orderByRaw(', 'groupByRaw('];

    $found = [];
    $app = dirname(__DIR__, 2).DIRECTORY_SEPARATOR.'app';
    foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($app, FilesystemIterator::SKIP_DOTS)) as $file) {
        $path = substr($file->getPathname(), strlen($app) + 1);
        if ($file->getExtension() !== 'php' || in_array($path, $allowed, true)) {
            continue;
        }
        $code = file_get_contents($file->getPathname());
        foreach ($forbidden as $call) {
            if (str_contains($code, $call)) {
                $found[] = "{$path}: {$call}";
            }
        }
    }

    expect($found)->toBe([]);
});

it('runs these tests with a table prefix', function () {
    expect(env('DB_TABLE_PREFIX'))->toBe('pt_');
});

it('accepts a short lowercase prefix that ends in an underscore, or none', function (string $prefix) {
    expect(TablePrefix::isValid($prefix))->toBeTrue();
})->with(['', 'a_', 'liga_', 'liga26_', 'abcdefg_']);

it('refuses any other prefix', function (string $prefix) {
    expect(TablePrefix::isValid($prefix))->toBeFalse()
        ->and(fn () => TablePrefix::assertValid($prefix))->toThrow(InvalidArgumentException::class);
})->with(['liga', 'Liga_', '1liga_', 'abcdefgh_', 'li-ga_', 'liga__', '_']);
