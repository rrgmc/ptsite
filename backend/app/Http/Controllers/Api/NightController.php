<?php

namespace PTSite\App\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use PTSite\App\Actions\Nights\CancelNight;
use PTSite\App\Actions\Nights\FinishNight;
use PTSite\App\Actions\Nights\ImportNight;
use PTSite\App\Actions\Nights\OpenNight;
use PTSite\App\Actions\Nights\RescheduleNight;
use PTSite\App\Actions\Nights\ScheduleNight;
use PTSite\App\Actions\Nights\ScheduleNights;
use PTSite\App\Actions\Nights\UndoOpenNight;
use PTSite\App\Actions\Nights\UpdateNight;
use PTSite\App\Http\Controllers\Controller;
use PTSite\App\Http\Requests\FinishNightRequest;
use PTSite\App\Http\Requests\ImportNightRequest;
use PTSite\App\Http\Requests\RescheduleNightRequest;
use PTSite\App\Http\Requests\ScheduleNightRequest;
use PTSite\App\Http\Requests\ScheduleNightsRequest;
use PTSite\App\Http\Requests\UpdateNightRequest;
use PTSite\App\Http\Resources\NightResource;
use PTSite\App\Models\Night;
use PTSite\App\Models\Season;

class NightController extends Controller
{
    public function show(Night $night): NightResource
    {
        $this->authorize('view', $night);

        return $this->resource($night);
    }

    /**
     * Schedule a night in a season ("Adicionar"). Results keepers and admins. An extra night is not a round and may
     * share its date. A Main Event night is always extra, a season takes one, and only an admin schedules it.
     */
    public function store(ScheduleNightRequest $request, Season $season, ScheduleNight $schedule): JsonResponse
    {
        $night = $schedule($request->user(), $season, $request->validated('starts_at'), $request->validated('place_id'), $request->validated('description'), $request->validated('type') ?? 'regular', $request->boolean('is_extra'));

        return $this->resource($night)->response()->setStatusCode(201);
    }

    /**
     * Schedule several nights at once, all or none: the dates chosen in the season planner (admins). Each night gets
     * the season's default place. Refuses dates that already have a night in the season.
     */
    public function storeMany(ScheduleNightsRequest $request, Season $season, ScheduleNights $schedule): JsonResponse
    {
        $nights = $schedule($request->user(), $season, $request->validated('starts_at'));

        return NightResource::collection(collect($nights)->map(fn (Night $n) => $n->load(NightResource::RELATIONS)))
            ->response()->setStatusCode(201);
    }

    /** Record a past night in one step, saved as finished ("Importar"). Results keepers and admins. */
    public function import(ImportNightRequest $request, Season $season, ImportNight $import): JsonResponse
    {
        $night = $import(
            $request->user(), $season, $request->validated('starts_at'), $request->validated('place_id'),
            $request->validated('pot'), $request->validated('main_event_pot'), $request->validated('time_chip'),
            $request->playerByPosition(), $request->boolean('is_extra'),
        );

        return $this->resource($night)->response()->setStatusCode(201);
    }

    /** Open a scheduled night ("Abrir"). Only one night per season can be open. */
    public function open(Night $night, OpenNight $open): NightResource
    {
        return $this->resource($open(request()->user(), $night));
    }

    /**
     * "Desfazer abertura": make a night opened by mistake scheduled again. Deletes its partial result and what the
     * night dashboard recorded; the attendance answers stay. Admins.
     */
    public function undoOpen(Request $request, Night $night, UndoOpenNight $undoOpen): NightResource
    {
        return $this->resource($undoOpen($request->user(), $night));
    }

    /**
     * Enter or correct a night's results ("Finalizar"). Points are calculated from the pot. A Main Event night is
     * finished with POST nights/{night}/main-event-result.
     */
    public function finish(FinishNightRequest $request, Night $night, FinishNight $finish): NightResource
    {
        return $this->resource($finish(
            $request->user(), $night,
            $request->validated('pot'), $request->validated('main_event_pot'), $request->validated('time_chip'),
            $request->playerByPosition(),
        ));
    }

    /**
     * "Editar evento": change a night's place or description, or whether it is extra. Results keepers and admins
     * for a scheduled night; only admins for an open or finished one.
     */
    public function update(UpdateNightRequest $request, Night $night, UpdateNight $update): NightResource
    {
        return $this->resource($update($request->user(), $night, $request->validated()));
    }

    /** "Remarcar": change a scheduled night's date and time. Results keepers and admins. */
    public function reschedule(RescheduleNightRequest $request, Night $night, RescheduleNight $reschedule): NightResource
    {
        return $this->resource($reschedule($request->user(), $night, $request->validated('starts_at')));
    }

    /** "Cancelar": cancel a scheduled night. It is archived, not deleted. Results keepers and admins. */
    public function cancel(Request $request, Night $night, CancelNight $cancel): NightResource
    {
        return $this->resource($cancel($request->user(), $night));
    }

    private function resource(Night $night): NightResource
    {
        return new NightResource($night->load(NightResource::RELATIONS));
    }
}
