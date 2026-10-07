<?php

namespace PTSite\App\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use PTSite\App\Actions\Attendance\AnswerAttendance;
use PTSite\App\Http\Controllers\Controller;
use PTSite\App\Http\Requests\AnswerAttendanceRequest;
use PTSite\App\Http\Resources\AttendanceResource;
use PTSite\App\Models\Night;
use PTSite\App\Models\Player;

class AttendanceController extends Controller
{
    /** Everyone's answers for a night, in the order they answered. Players without an answer are not listed. */
    public function index(Night $night): AnonymousResourceCollection
    {
        $this->authorize('view', $night);

        return AttendanceResource::collection($night->attendances()->with(['player', 'answeredBy'])->get());
    }

    /**
     * Set a player's answer: "all_in" or "fold". Players answer for themselves; results keepers and admins for
     * anyone. Repeating the same answer changes nothing.
     */
    public function update(AnswerAttendanceRequest $request, Night $night, Player $player, AnswerAttendance $answer): JsonResponse
    {
        $row = $answer($request->user(), $night, $player, $request->answer());

        // Always 200, whether the answer is new or changed.
        return (new AttendanceResource($row->load(['player', 'answeredBy'])))->response()->setStatusCode(200);
    }

    /** Remove a player's answer ("Não confirmado"). */
    public function destroy(Request $request, Night $night, Player $player, AnswerAttendance $answer): Response
    {
        $answer($request->user(), $night, $player, null);

        return response()->noContent();
    }
}
