<?php

namespace PTSite\App\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use PTSite\App\Actions\Seasons\SaveSeason;
use PTSite\App\Http\Controllers\Controller;
use PTSite\App\Http\Requests\PlanNightsRequest;
use PTSite\App\Http\Requests\SaveSeasonRequest;
use PTSite\App\Http\Requests\SimulateRequest;
use PTSite\App\Http\Requests\UpdateSeasonRequest;
use PTSite\App\Http\Resources\CalendarEntryResource;
use PTSite\App\Http\Resources\NightResource;
use PTSite\App\Http\Resources\PlannedDateResource;
use PTSite\App\Http\Resources\SeasonResource;
use PTSite\App\Http\Resources\SeasonTopStandingsResource;
use PTSite\App\Http\Resources\SimulatedStandingResource;
use PTSite\App\Http\Resources\StandingResource;
use PTSite\App\Http\Resources\SuggestedNightResource;
use PTSite\App\Models\Season;
use PTSite\App\Queries\PlanSeasonNights;
use PTSite\App\Queries\SeasonCalendar;
use PTSite\App\Queries\SeasonStandings;
use PTSite\App\Queries\SeasonsTopStandings;
use PTSite\App\Queries\SimulateRanking;
use PTSite\App\Queries\SuggestNightDates;

class SeasonController extends Controller
{
    /** All seasons, newest first. Accepts updated_since (ISO 8601) for syncing. */
    public function index(Request $request): AnonymousResourceCollection
    {
        $seasons = Season::query()
            ->when(! $request->user()->isAdmin(), fn ($q) => $q->notArchived())
            ->when($request->query('updated_since'), fn ($q, $since) => $q->where('updated_at', '>', $since))
            ->with(['defaultPlace', 'percentages'])
            ->withCount(self::counts())
            ->orderByDesc('starts_on')
            ->get();

        return SeasonResource::collection($seasons);
    }

    /** The current season: the newest one that is open and not finished. */
    public function current(): SeasonResource|JsonResponse
    {
        $season = Season::query()->current()->with(['defaultPlace', 'percentages'])->withCount(self::counts())->first();

        return $season ? new SeasonResource($season) : response()->json(['message' => 'Nenhuma temporada aberta.'], 404);
    }

    /**
     * Every season that is not archived, newest first, each with the first ten of its standings.
     * When the tenth place is shared, tied_not_shown counts the players left out.
     */
    public function topStandings(Request $request, SeasonsTopStandings $top): AnonymousResourceCollection
    {
        $seasons = Season::query()
            ->notArchived()
            ->with(['defaultPlace', 'percentages'])
            ->withCount(self::counts())
            ->orderByDesc('starts_on')
            ->orderByDesc('id')
            ->get();

        return SeasonTopStandingsResource::collection($top($seasons, $request->user()->isAdmin()));
    }

    public function show(Season $season): SeasonResource
    {
        return new SeasonResource($season->load(['defaultPlace', 'percentages'])->loadCount(self::counts()));
    }

    /** Standings of the season, highest total first. Players with the same total share a rank. */
    public function standings(Season $season, SeasonStandings $standings): AnonymousResourceCollection
    {
        return StandingResource::collection($standings($season));
    }

    /**
     * The season's nights, oldest first, with results: the rounds, the extra nights and the Main Event night.
     * Accepts status and updated_since filters.
     */
    public function nights(Request $request, Season $season): AnonymousResourceCollection
    {
        $nights = $season->nights()
            ->when(! $request->user()->isAdmin(), fn ($q) => $q->notArchived())
            ->when($request->query('status'), fn ($q, $status) => $q->where('status', $status))
            ->when($request->query('updated_since'), fn ($q, $since) => $q->where('updated_at', '>', $since))
            ->with(NightResource::RELATIONS)
            ->orderBy('starts_at')
            ->orderBy('id')
            ->get();

        return NightResource::collection($nights);
    }

    /**
     * Suggested dates for a new night: the next three regular weekdays, at the regular time, from today.
     * Dates that already have a night are left out. Only suggestions; any date can be scheduled.
     */
    public function nightSuggestions(Season $season, SuggestNightDates $suggest): AnonymousResourceCollection
    {
        return SuggestedNightResource::collection($suggest($season));
    }

    /**
     * The season calendar: its nights (with the winner of finished ones, the ALL IN count and the user's answer)
     * and the regular nights left out because of a holiday, an emenda or Carnival, in date order.
     */
    public function calendar(Request $request, Season $season, SeasonCalendar $calendar): AnonymousResourceCollection
    {
        return CalendarEntryResource::collection($calendar($season, $request->user()));
    }

    /**
     * The season planner (admins): the regular nights between two dates, every N weeks, with holidays, emendas and
     * the Carnival weekend left out and the reason given. Dates that already have a night are marked taken.
     * With `count`, the plan stops at the night that completes that many (the rounds left). Nothing is saved;
     * schedule the chosen dates with POST seasons/{season}/nights/batch.
     */
    public function nightPlan(PlanNightsRequest $request, Season $season, PlanSeasonNights $plan): AnonymousResourceCollection
    {
        $this->authorize('update', $season);

        return PlannedDateResource::collection($plan($season, $request->from(), $request->to(), $request->count()));
    }

    /** "What if" standings for an imagined next night. Nothing is saved. */
    public function simulate(SimulateRequest $request, Season $season, SimulateRanking $simulate): AnonymousResourceCollection
    {
        return SimulatedStandingResource::collection(
            $simulate($season->load('percentages'), $request->validated('pot'), $request->playerByPosition()),
        );
    }

    public function store(SaveSeasonRequest $request, SaveSeason $save): JsonResponse
    {
        $season = $save($request->user(), null, $request->seasonData());

        return (new SeasonResource($season->load(['defaultPlace', 'percentages'])->loadCount(self::counts())))->response()->setStatusCode(201);
    }

    public function update(UpdateSeasonRequest $request, Season $season, SaveSeason $save): SeasonResource
    {
        return new SeasonResource($save($request->user(), $season, $request->seasonData())->load(['defaultPlace', 'percentages'])->loadCount(self::counts()));
    }

    /**
     * Finished rounds (nights_count) and all rounds that are not archived (nights_planned, against the rounds).
     * An extra night is not a round.
     */
    private static function counts(): array
    {
        return [
            'nights' => fn ($q) => $q->finished()->rounds(),
            'nights as nights_planned_count' => fn ($q) => $q->notArchived()->rounds(),
        ];
    }
}
