<?php

namespace PTSite\App\Support;

use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

/**
 * Creates the configured MySQL database on the development server when it is missing. That server keeps its data
 * in memory (compose.yaml), so every database is gone after a restart; the tests also use databases of their own.
 */
final class DatabaseCreator
{
    public static function createIfMissing(): void
    {
        $connection = config('database.default');
        $settings = config("database.connections.{$connection}");
        if ($settings['driver'] !== 'mysql') {
            return;
        }
        $database = $settings['database'];
        if (! preg_match('/^\w+$/', $database)) {
            throw new InvalidArgumentException("Not a database name: {$database}");
        }

        // Connect without a database: selecting a missing one fails.
        config(["database.connections.{$connection}.database" => null]);
        DB::purge($connection);
        try {
            DB::connection($connection)->statement(
                "create database if not exists `{$database}` character set {$settings['charset']} collate {$settings['collation']}"
            );
        } finally {
            config(["database.connections.{$connection}.database" => $database]);
            DB::purge($connection);
        }
    }
}
