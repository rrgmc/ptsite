<?php

namespace PTSite\App\Http\Controllers\Api;

use Illuminate\Http\Request;
use PTSite\App\Actions\Nights\Dashboard\AddRebuy;
use PTSite\App\Actions\Nights\Dashboard\MarkNightPlayer;
use PTSite\App\Actions\Nights\Dashboard\MarkRebuy;
use PTSite\App\Actions\Nights\Dashboard\RemoveNightPlayer;
use PTSite\App\Actions\Nights\Dashboard\RemoveRebuy;
use PTSite\App\Actions\Nights\Dashboard\SetHouseOwner;
use PTSite\App\Actions\Nights\Dashboard\SetPartialMainEventPot;
use PTSite\App\Actions\Nights\Dashboard\SetPartialPosition;
use PTSite\App\Http\Controllers\Controller;
use PTSite\App\Http\Requests\AddRebuyRequest;
use PTSite\App\Http\Requests\MarkNightPlayerRequest;
use PTSite\App\Http\Requests\MarkRebuyRequest;
use PTSite\App\Http\Requests\SetHouseOwnerRequest;
use PTSite\App\Http\Requests\SetMainEventPotRequest;
use PTSite\App\Http\Requests\SetPartialPositionRequest;
use PTSite\App\Http\Resources\NightDashboardResource;
use PTSite\App\Models\Night;
use PTSite\App\Models\NightRebuy;
use PTSite\App\Models\Player;
use PTSite\App\Queries\NightDashboard;

/**
 * The night dashboard ("Painel do evento"), on a site that has it. Active players, results keepers and admins
 * change an open night's; only admins a finished night's. Every change answers the whole dashboard.
 */
class NightDashboardController extends Controller
{
    public function __construct(private readonly NightDashboard $dashboard) {}

    /**
     * A night's dashboard: the participants with what they bought and paid, the pot and the time chip worked out
     * from it, and the open night's partial result. Made to be asked for again every few seconds.
     */
    public function show(Request $request, Night $night): NightDashboardResource
    {
        $this->authorize('view', $night);

        return $this->resource($request, $night);
    }

    /**
     * Set a participant's marks; leave out the ones that stay. Any call makes the player a participant and, on
     * an open night, answers ALL IN for them: with no mark it only confirms the player.
     */
    public function markPlayer(MarkNightPlayerRequest $request, Night $night, Player $player, MarkNightPlayer $mark): NightDashboardResource
    {
        $set = fn (string $key) => $request->has($key) ? $request->boolean($key) : null;

        return $this->resource($request, $mark($request->user(), $night, $player, $set('buy_in_paid'), $set('time_chip'), $set('time_chip_paid')));
    }

    /** "Remover do evento": take a participant with no marks and no rebuys off the night. */
    public function removePlayer(Request $request, Night $night, Player $player, RemoveNightPlayer $remove): NightDashboardResource
    {
        return $this->resource($request, $remove($request->user(), $night, $player));
    }

    /**
     * "+ Rebuy": record one more rebuy of a player. Send the number of rebuys the player had on the screen: when
     * it is no longer that number, someone else recorded the same rebuy and nothing is added.
     */
    public function addRebuy(AddRebuyRequest $request, Night $night, Player $player, AddRebuy $add): NightDashboardResource
    {
        return $this->resource($request, $add($request->user(), $night, $player, $request->integer('count')));
    }

    /** Mark a rebuy as paid or not paid. */
    public function markRebuy(MarkRebuyRequest $request, Night $night, NightRebuy $rebuy, MarkRebuy $mark): NightDashboardResource
    {
        return $this->resource($request, $mark($request->user(), $night, $rebuy, $request->boolean('paid')));
    }

    /** Remove a rebuy recorded by mistake. */
    public function removeRebuy(Request $request, Night $night, NightRebuy $rebuy, RemoveRebuy $remove): NightDashboardResource
    {
        return $this->resource($request, $remove($request->user(), $night, $rebuy));
    }

    /** "Dono da casa": say who owns the house where the night is played, or null for nobody. */
    public function setHouseOwner(SetHouseOwnerRequest $request, Night $night, SetHouseOwner $set): NightDashboardResource
    {
        $player = $request->validated('player_id') === null ? null : Player::query()->findOrFail($request->validated('player_id'));

        return $this->resource($request, $set($request->user(), $night, $player));
    }

    /** Put a player in one scoring position of the open night's partial result, or null to empty it. */
    public function setPosition(SetPartialPositionRequest $request, Night $night, int $position, SetPartialPosition $set): NightDashboardResource
    {
        $player = $request->validated('player_id') === null ? null : Player::query()->findOrFail($request->validated('player_id'));

        return $this->resource($request, $set($request->user(), $night, $position, $player));
    }

    /** Set the Main Event pot of the open night's partial result. */
    public function setMainEventPot(SetMainEventPotRequest $request, Night $night, SetPartialMainEventPot $set): NightDashboardResource
    {
        return $this->resource($request, $set($request->user(), $night, $request->validated('amount')));
    }

    private function resource(Request $request, Night $night): NightDashboardResource
    {
        return new NightDashboardResource(($this->dashboard)($request->user(), $night));
    }
}
