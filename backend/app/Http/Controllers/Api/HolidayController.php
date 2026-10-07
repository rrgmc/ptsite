<?php

namespace PTSite\App\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use PTSite\App\Actions\Holidays\DeleteHolidayException;
use PTSite\App\Actions\Holidays\SaveHoliday;
use PTSite\App\Actions\Holidays\SaveHolidayException;
use PTSite\App\Http\Controllers\Controller;
use PTSite\App\Http\Requests\SaveHolidayExceptionRequest;
use PTSite\App\Http\Requests\SaveHolidayRequest;
use PTSite\App\Http\Requests\UpdateHolidayRequest;
use PTSite\App\Http\Resources\CalendarHolidayResource;
use PTSite\App\Http\Resources\HolidayExceptionResource;
use PTSite\App\Http\Resources\HolidayResource;
use PTSite\App\Models\Holiday;
use PTSite\App\Models\HolidayException;
use PTSite\App\Queries\HolidayCalendarForYear;
use PTSite\App\Queries\SortByName;

/** The holiday table used by the season planner, and its changes for single years. */
class HolidayController extends Controller
{
    /** The holiday table, by name. Admins can add archived=1 to see archived holidays too. */
    public function index(Request $request): AnonymousResourceCollection
    {
        return HolidayResource::collection(SortByName::sort(Holiday::query()
            ->when(! ($request->boolean('archived') && $request->user()->isAdmin()), fn ($q) => $q->notArchived())
            ->get(), fn (Holiday $h) => $h->name));
    }

    public function store(SaveHolidayRequest $request, SaveHoliday $save): JsonResponse
    {
        return (new HolidayResource($save($request->user(), null, $request->validated())))->response()->setStatusCode(201);
    }

    public function update(UpdateHolidayRequest $request, Holiday $holiday, SaveHoliday $save): HolidayResource
    {
        return new HolidayResource($save($request->user(), $holiday, $request->validated()));
    }

    /** The holidays of one year, in date order, including the ones cancelled for that year and the extras. */
    public function calendar(int $year, HolidayCalendarForYear $calendar): AnonymousResourceCollection
    {
        abort_if($year < 1900 || $year > 2200, 404);

        return CalendarHolidayResource::collection($calendar($year));
    }

    /** Cancel a table holiday for one year, or add an extra holiday that year. */
    public function storeException(SaveHolidayExceptionRequest $request, SaveHolidayException $save): JsonResponse
    {
        return (new HolidayExceptionResource($save($request->user(), $request->validated())))->response()->setStatusCode(201);
    }

    /** Undo a one-year change. */
    public function destroyException(Request $request, HolidayException $exception, DeleteHolidayException $delete): Response
    {
        $delete($request->user(), $exception);

        return response()->noContent();
    }
}
