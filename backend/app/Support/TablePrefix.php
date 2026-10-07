<?php

namespace PTSite\App\Support;

use InvalidArgumentException;

/**
 * The prefix of every table name, set with DB_TABLE_PREFIX. It lets two sites share one database. Empty: no
 * prefix.
 */
final class TablePrefix
{
    /**
     * A prefix is a letter, up to six more letters or digits, and an underscore: "liga_". It is this short
     * because MySQL allows 64 characters for the name of a key, and the longest key name here has 56.
     */
    private const PATTERN = '/^[a-z][a-z0-9]{0,6}_$/';

    public static function isValid(string $prefix): bool
    {
        return $prefix === '' || preg_match(self::PATTERN, $prefix) === 1;
    }

    public static function assertValid(string $prefix): void
    {
        if (! self::isValid($prefix)) {
            throw new InvalidArgumentException(
                "DB_TABLE_PREFIX \"{$prefix}\" is not a table prefix: use a lowercase letter, up to six more lowercase letters or digits, and an underscore, such as \"liga_\"."
            );
        }
    }
}
