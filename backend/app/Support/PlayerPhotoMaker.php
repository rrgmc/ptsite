<?php

namespace PTSite\App\Support;

use Illuminate\Image\Image;
use Illuminate\Image\ImageException;
use Illuminate\Image\ImageManager;
use PTSite\App\Enums\PlayerImageKind;
use PTSite\Domain\Shared\RuleViolation;

/**
 * Makes a player's photo and thumbnail from one uploaded picture: turned upright, cut from the middle to the
 * image's shape, resized and saved as JPEG. A picture smaller than the photo is enlarged.
 * The image software is chosen with IMAGE_DRIVER (docs/decisions/0016-server-side-player-photos.md).
 */
final class PlayerPhotoMaker
{
    private const JPEG_QUALITY = 85;

    public function __construct(private readonly ImageManager $images) {}

    /**
     * @return array<string, string> The JPEG bytes, keyed by PlayerImageKind value.
     *
     * @throws RuleViolation when the picture cannot be read.
     */
    public function make(string $picture): array
    {
        try {
            $photo = $this->cover($this->images->fromBytes($picture)->orient(), PlayerImageKind::Photo);

            // The thumbnail has the photo's shape, so it is made from the photo: the large picture is read once.
            return [
                PlayerImageKind::Photo->value => $photo,
                PlayerImageKind::Thumbnail->value => $this->cover($this->images->fromBytes($photo), PlayerImageKind::Thumbnail),
            ];
        } catch (ImageException $e) {
            // Logged, because missing image software on the server fails the same way as a broken picture.
            report($e);

            throw new RuleViolation('player.photo.unreadable', 'image');
        }
    }

    private function cover(Image $image, PlayerImageKind $kind): string
    {
        return $image->cover($kind->width(), $kind->height())->toJpg()->quality(self::JPEG_QUALITY)->toBytes();
    }
}
