<?php

namespace PTSite\Domain\Shared;

/**
 * How lists of names are sorted on screen: alphabetically, ignoring capitals and accents, so "breno" comes before
 * "Carlão" and "Élio" among the E's (docs/specs/players.md). Databases sort differently (SQLite by bytes, MySQL by
 * its collation), so lists are sorted with this instead.
 */
final class NameOrder
{
    private const ACCENTS = [
        'á' => 'a', 'à' => 'a', 'â' => 'a', 'ã' => 'a', 'ä' => 'a', 'Á' => 'a', 'À' => 'a', 'Â' => 'a', 'Ã' => 'a', 'Ä' => 'a',
        'é' => 'e', 'è' => 'e', 'ê' => 'e', 'ë' => 'e', 'É' => 'e', 'È' => 'e', 'Ê' => 'e', 'Ë' => 'e',
        'í' => 'i', 'ì' => 'i', 'î' => 'i', 'ï' => 'i', 'Í' => 'i', 'Ì' => 'i', 'Î' => 'i', 'Ï' => 'i',
        'ó' => 'o', 'ò' => 'o', 'ô' => 'o', 'õ' => 'o', 'ö' => 'o', 'Ó' => 'o', 'Ò' => 'o', 'Ô' => 'o', 'Õ' => 'o', 'Ö' => 'o',
        'ú' => 'u', 'ù' => 'u', 'û' => 'u', 'ü' => 'u', 'Ú' => 'u', 'Ù' => 'u', 'Û' => 'u', 'Ü' => 'u',
        'ç' => 'c', 'Ç' => 'c', 'ñ' => 'n', 'Ñ' => 'n',
    ];

    /** Negative, zero or positive, like strcmp. Names that differ only in capitals or accents keep a fixed order. */
    public static function compare(string $a, string $b): int
    {
        return strcmp(self::fold($a), self::fold($b)) ?: strcmp($a, $b);
    }

    private static function fold(string $name): string
    {
        return mb_strtolower(strtr($name, self::ACCENTS));
    }
}
