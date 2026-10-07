<?php

namespace PTSite\App\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use PTSite\App\Actions\Nights\SavePartialResult;
use PTSite\App\Http\Controllers\Controller;
use PTSite\App\Http\Requests\SavePartialResultRequest;
use PTSite\App\Http\Resources\NightPartialResultResource;
use PTSite\App\Models\Night;
use PTSite\App\Models\NightPartialResult;

class PartialResultController extends Controller
{
    /**
     * A night's partial result ("Resultado parcial"): what the players recorded so far. When nobody saved one, and
     * on a night that is not open, every field is empty.
     */
    public function show(Night $night): NightPartialResultResource
    {
        $this->authorize('view', $night);

        return $this->resource($night->partialResult ?? new NightPartialResult);
    }

    /**
     * Save the partial result of an open night. Active players, results keepers and admins. It replaces all of
     * it: send null for an amount that is not known and leave out the positions that are empty.
     */
    public function update(SavePartialResultRequest $request, Night $night, SavePartialResult $save): JsonResponse
    {
        $partial = $save(
            $request->user(),
            $night,
            $request->validated('pot'),
            $request->validated('main_event_pot'),
            $request->validated('time_chip'),
            $request->playerByPosition(),
        );

        // Always 200, whether it is the first save or a later one.
        return $this->resource($partial)->response()->setStatusCode(200);
    }

    private function resource(NightPartialResult $partial): NightPartialResultResource
    {
        return new NightPartialResultResource($partial->load(['positions.player', 'savedBy']));
    }
}
