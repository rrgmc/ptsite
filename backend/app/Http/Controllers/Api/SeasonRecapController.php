<?php

namespace PTSite\App\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use PTSite\App\Actions\Recaps\DeleteSeasonRecap;
use PTSite\App\Actions\Recaps\SaveSeasonRecap;
use PTSite\App\Http\Controllers\Controller;
use PTSite\App\Http\Requests\SaveSeasonRecapRequest;
use PTSite\App\Http\Requests\UpdateSeasonRecapRequest;
use PTSite\App\Http\Resources\SeasonDigestResource;
use PTSite\App\Http\Resources\SeasonRecapResource;
use PTSite\App\Models\Season;
use PTSite\App\Models\SeasonRecap;
use PTSite\App\Queries\SeasonDigest;

class SeasonRecapController extends Controller
{
    /** The season's published recaps, newest first. Writers and admins also get the drafts. */
    public function index(Request $request, Season $season): AnonymousResourceCollection
    {
        return SeasonRecapResource::collection($season->recaps()
            ->when($request->user()->cannot('viewDrafts', SeasonRecap::class), fn ($q) => $q->published())
            ->with(['night', 'author'])
            ->newestFirst()
            ->get());
    }

    /** Write a recap of the season. Only on a site that shows recaps. */
    public function store(SaveSeasonRecapRequest $request, Season $season, SaveSeasonRecap $save): JsonResponse
    {
        $recap = $save($request->user(), $season, null, $request->validated());

        return (new SeasonRecapResource($recap->load(['night', 'author'])))->response()->setStatusCode(201);
    }

    /** Change a recap's text or night, or publish it or make it a draft again. Publishing needs a site that shows recaps. */
    public function update(UpdateSeasonRecapRequest $request, SeasonRecap $recap, SaveSeasonRecap $save): SeasonRecapResource
    {
        return new SeasonRecapResource($save($request->user(), $recap->season, $recap, $request->validated())->load(['night', 'author']));
    }

    public function destroy(Request $request, SeasonRecap $recap, DeleteSeasonRecap $delete): Response
    {
        $delete($request->user(), $recap);

        return response()->noContent();
    }

    /**
     * Everything a recap of the season needs, in one read: the standings and how they moved on the latest night,
     * that night's results, the next night, the rounds left and the latest published recaps.
     */
    public function digest(Season $season, SeasonDigest $digest): SeasonDigestResource
    {
        return new SeasonDigestResource($digest($season));
    }
}
