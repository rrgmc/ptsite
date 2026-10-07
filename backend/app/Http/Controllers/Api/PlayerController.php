<?php

namespace PTSite\App\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use PTSite\App\Actions\Players\QuickAddPlayer;
use PTSite\App\Actions\Players\RemovePlayerPhoto;
use PTSite\App\Actions\Players\SavePlayer;
use PTSite\App\Actions\Players\SavePlayerPhoto;
use PTSite\App\Enums\PlayerImageKind;
use PTSite\App\Enums\PlayerStatus;
use PTSite\App\Http\Controllers\Controller;
use PTSite\App\Http\Requests\QuickAddPlayerRequest;
use PTSite\App\Http\Requests\SavePlayerPhotoRequest;
use PTSite\App\Http\Requests\SavePlayerRequest;
use PTSite\App\Http\Requests\UpdatePlayerRequest;
use PTSite\App\Http\Resources\PlayerDetailResource;
use PTSite\App\Http\Resources\PlayerResource;
use PTSite\App\Models\Player;
use PTSite\App\Queries\SortByName;

class PlayerController extends Controller
{
    /**
     * Players, each with the memo: active first, then inactive, by nickname ignoring capitals and accents. Archived
     * players only for admins with archived=1.
     * Filters: status (active|inactive), search (nickname or name), updated_since (ISO 8601).
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $withArchived = $request->boolean('archived') && $request->user()->can('viewArchived', Player::class);

        $players = Player::query()
            ->when($request->user()->isAdmin(), fn ($q) => $q->with('user'))
            ->when(! $withArchived, fn ($q) => $q->notArchived())
            ->when($request->query('status'), fn ($q, $status) => $q->where('status', $status))
            ->when($request->query('search'), fn ($q, $search) => $q->where(fn ($q) => $q
                ->where('nickname', 'like', "%{$search}%")->orWhere('name', 'like', "%{$search}%")))
            ->when($request->query('updated_since'), fn ($q, $since) => $q->where('updated_at', '>', $since))
            ->get();

        return PlayerDetailResource::collection(SortByName::sort($players, fn (Player $p) => $p->nickname, fn (Player $p) => $p->status === PlayerStatus::Active));
    }

    /** One player, with the memo. */
    public function show(Player $player): PlayerDetailResource
    {
        return new PlayerDetailResource($player);
    }

    /**
     * A player's thumbnail, as an image file. 404 when the player has none.
     * The answer can be cached for a year: put the player's thumbnail_version in the URL (?v=...).
     */
    public function thumbnail(Player $player): Response
    {
        return $this->image($player, PlayerImageKind::Thumbnail);
    }

    /**
     * A player's photo, larger than the thumbnail, as an image file. 404 when the player has none.
     * The answer can be cached for a year: put the player's photo_version in the URL (?v=...).
     */
    public function photo(Player $player): Response
    {
        return $this->image($player, PlayerImageKind::Photo);
    }

    /**
     * Set a player's photo and thumbnail from one picture, replacing the ones there were. Admins, and the player
     * themself. The server cuts the picture from the middle to 3 wide by 4 tall and makes both images as JPEG:
     * the photo with 600 x 800 pixels and the thumbnail with 180 x 240.
     * Send the picture as multipart/form-data in `image`: JPEG, PNG or WebP, 8 MB at most, and between 180 and
     * 4096 pixels a side.
     */
    public function storePhoto(SavePlayerPhotoRequest $request, Player $player, SavePlayerPhoto $save): PlayerResource
    {
        return new PlayerResource($save($request->user(), $player, $request->file('image')->getContent()));
    }

    /** Remove a player's photo and thumbnail together. Admins, and the player themself. */
    public function destroyPhoto(Request $request, Player $player, RemovePlayerPhoto $remove): PlayerResource
    {
        return new PlayerResource($remove($request->user(), $player));
    }

    private function image(Player $player, PlayerImageKind $kind): Response
    {
        $image = $player->images()->where('kind', $kind)->first();
        abort_if($image === null, 404);

        return response($image->image, 200, [
            'Content-Type' => $image->mime_type,
            'Cache-Control' => 'private, max-age=31536000, immutable',
        ]);
    }

    /** Add a first-timer by nickname only, e.g. from the results form. Results keepers and admins. */
    public function quickAdd(QuickAddPlayerRequest $request, QuickAddPlayer $quickAdd): JsonResponse
    {
        return (new PlayerResource($quickAdd($request->user(), $request->validated('nickname'))))->response()->setStatusCode(201);
    }

    public function store(SavePlayerRequest $request, SavePlayer $save): JsonResponse
    {
        return (new PlayerDetailResource($save($request->user(), null, $request->validated())))->response()->setStatusCode(201);
    }

    /**
     * Update a player. Admins change everything: the profile, the memo, active or inactive, archived or restored.
     * A player changes their own nickname, name, email and birthday.
     */
    public function update(UpdatePlayerRequest $request, Player $player, SavePlayer $save): PlayerDetailResource
    {
        return new PlayerDetailResource($save($request->user(), $player, $request->validated()));
    }
}
