<?php

namespace PTSite\App\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use PTSite\App\Actions\Nights\FinishMainEventNight;
use PTSite\App\Actions\Nights\ImportMainEventNight;
use PTSite\App\Http\Controllers\Controller;
use PTSite\App\Http\Requests\FinishMainEventNightRequest;
use PTSite\App\Http\Requests\ImportMainEventNightRequest;
use PTSite\App\Http\Resources\NightResource;
use PTSite\App\Models\Night;
use PTSite\App\Models\Season;

/**
 * The result of a Main Event night: the order of its players, with no pot and no points. An admin adds the night
 * to its season, with type main_event; it is then opened, edited and cancelled like any other.
 */
class MainEventController extends Controller
{
    /** Enter or correct the result of a Main Event night ("Finalizar"). Results keepers and admins. */
    public function finish(FinishMainEventNightRequest $request, Night $night, FinishMainEventNight $finish): NightResource
    {
        return $this->resource($finish($request->user(), $night, $request->playerIds()));
    }

    /**
     * Record a past Main Event in one step, saved as finished ("Importar"). Admins. A finished season takes it
     * too.
     */
    public function import(ImportMainEventNightRequest $request, Season $season, ImportMainEventNight $import): JsonResponse
    {
        $night = $import(
            $request->user(), $season, $request->validated('starts_at'), $request->validated('place_id'),
            $request->validated('description'), $request->playerIds(),
        );

        return $this->resource($night)->response()->setStatusCode(201);
    }

    private function resource(Night $night): NightResource
    {
        return new NightResource($night->load(NightResource::RELATIONS));
    }
}
