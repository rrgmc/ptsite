<?php

namespace PTSite\Domain\Features;

/**
 * Which features this site has: the "features" of its site.json, with the default for each one it leaves out.
 */
final readonly class Features
{
    /** @param array<string, mixed> $settings feature name => true or false; other names and values are ignored */
    public function __construct(private array $settings = []) {}

    public function enabled(Feature $feature): bool
    {
        $value = $this->settings[$feature->value] ?? null;

        return is_bool($value) ? $value : $feature->default();
    }
}
