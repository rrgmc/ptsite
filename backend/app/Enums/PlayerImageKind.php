<?php

namespace PTSite\App\Enums;

/**
 * A player's two images. Both are 3 wide by 4 tall and made by the server from one uploaded picture
 * (docs/specs/players.md). Images imported from an older site keep their sizes.
 */
enum PlayerImageKind: string
{
    /** The small photo next to a nickname. */
    case Thumbnail = 'thumbnail';

    /** The larger photo. */
    case Photo = 'photo';

    /** The players column that holds this image's version. */
    public function versionColumn(): string
    {
        return $this->value.'_version';
    }

    /** The width the server makes this image, in pixels. */
    public function width(): int
    {
        return match ($this) {
            self::Thumbnail => 180,
            self::Photo => 600,
        };
    }

    /** The height the server makes this image, in pixels. */
    public function height(): int
    {
        return match ($this) {
            self::Thumbnail => 240,
            self::Photo => 800,
        };
    }
}
