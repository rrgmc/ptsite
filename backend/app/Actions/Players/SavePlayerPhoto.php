<?php

namespace PTSite\App\Actions\Players;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use PTSite\App\Enums\PlayerImageKind;
use PTSite\App\Models\Player;
use PTSite\App\Models\PlayerImage;
use PTSite\App\Models\User;
use PTSite\App\Support\AuditLogger;
use PTSite\App\Support\PlayerPhotoMaker;

/**
 * Sets a player's photo and thumbnail from one uploaded picture, replacing the ones there were. Admins, and the
 * player themself. The two images always change together.
 */
final class SavePlayerPhoto
{
    public function __construct(private readonly AuditLogger $audit, private readonly PlayerPhotoMaker $maker) {}

    public function __invoke(User $user, Player $player, string $picture): Player
    {
        Gate::forUser($user)->authorize('updateProfile', $player);

        // Outside the transaction: the image work is slow and touches no data.
        $images = $this->maker->make($picture);

        return DB::transaction(function () use ($user, $player, $images) {
            $before = $this->versions($player);

            foreach ($images as $kind => $image) {
                PlayerImage::query()->updateOrCreate(
                    ['player_id' => $player->id, 'kind' => $kind],
                    ['mime_type' => 'image/jpeg', 'image' => $image],
                );
                $player->forceFill([PlayerImageKind::from($kind)->versionColumn() => substr(sha1($image), 0, 16)]);
            }
            $player->save();

            // The log says that the images changed, not what they show.
            $this->audit->record($user, 'player.image_saved', $player, $before, $this->versions($player));

            return $player;
        });
    }

    /** @return array<string, string|null> */
    private function versions(Player $player): array
    {
        return $player->only(['thumbnail_version', 'photo_version']);
    }
}
