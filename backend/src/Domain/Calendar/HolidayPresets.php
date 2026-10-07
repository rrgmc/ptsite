<?php

namespace PTSite\Domain\Calendar;

use InvalidArgumentException;

/** Finds a holiday preset by its short name or by its class name. */
final class HolidayPresets
{
    /** @var array<string, class-string<HolidayPreset>> */
    private const BUILT_IN = [
        'sao-paulo' => SaoPauloHolidays::class,
    ];

    /** @return list<HolidayRule> empty when no preset is named */
    public static function rules(?string $preset): array
    {
        $preset = trim((string) $preset);
        if ($preset === '') {
            return [];
        }

        $class = self::BUILT_IN[$preset] ?? $preset;
        if (! is_a($class, HolidayPreset::class, true)) {
            throw new InvalidArgumentException("Unknown holiday preset: {$preset}");
        }

        return $class::rules();
    }
}
