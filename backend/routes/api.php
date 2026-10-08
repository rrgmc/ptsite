<?php

use Illuminate\Support\Facades\Route;
use PTSite\App\Http\Controllers\Api\AttendanceController;
use PTSite\App\Http\Controllers\Api\AuditLogController;
use PTSite\App\Http\Controllers\Api\AuthController;
use PTSite\App\Http\Controllers\Api\HolidayController;
use PTSite\App\Http\Controllers\Api\MainEventController;
use PTSite\App\Http\Controllers\Api\NightController;
use PTSite\App\Http\Controllers\Api\NightDashboardController;
use PTSite\App\Http\Controllers\Api\PartialResultController;
use PTSite\App\Http\Controllers\Api\PasswordResetController;
use PTSite\App\Http\Controllers\Api\PlaceController;
use PTSite\App\Http\Controllers\Api\PlayerController;
use PTSite\App\Http\Controllers\Api\PlayerLoginController;
use PTSite\App\Http\Controllers\Api\PlayerStatisticsController;
use PTSite\App\Http\Controllers\Api\SeasonController;
use PTSite\App\Http\Controllers\Api\StatisticsController;
use PTSite\App\Http\Middleware\RequireFeature;
use PTSite\Domain\Features\Feature;

Route::prefix('v1')->group(function () {
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:'.config('ptsite.auth.login_attempts_per_minute').',1');
    Route::post('tokens', [AuthController::class, 'createToken'])->middleware('throttle:'.config('ptsite.auth.login_attempts_per_minute').',1');
    // A forgotten password. Each limit has a name, so that it does not share the login's count.
    Route::post('password-resets', [PasswordResetController::class, 'store'])->middleware('throttle:'.config('ptsite.password_reset.attempts_per_minute').',1,password-reset-request');
    Route::middleware('throttle:'.config('ptsite.auth.login_attempts_per_minute').',1,password-reset-use')->group(function () {
        Route::get('password-resets/{token}', [PasswordResetController::class, 'show']);
        Route::post('password-resets/{token}/complete', [PasswordResetController::class, 'complete']);
    });

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);
        // Limited like the login: each try checks a password.
        Route::put('me/password', [AuthController::class, 'changePassword'])->middleware('throttle:'.config('ptsite.auth.login_attempts_per_minute').',1');

        Route::get('seasons', [SeasonController::class, 'index']);
        Route::get('seasons/current', [SeasonController::class, 'current']);
        Route::get('seasons/top-standings', [SeasonController::class, 'topStandings']);
        Route::post('seasons', [SeasonController::class, 'store']);
        Route::get('seasons/{season}', [SeasonController::class, 'show']);
        Route::patch('seasons/{season}', [SeasonController::class, 'update']);
        Route::get('seasons/{season}/standings', [SeasonController::class, 'standings']);
        Route::get('seasons/{season}/nights', [SeasonController::class, 'nights']);
        Route::get('seasons/{season}/night-suggestions', [SeasonController::class, 'nightSuggestions']);
        Route::post('seasons/{season}/simulate', [SeasonController::class, 'simulate']);
        Route::post('seasons/{season}/nights', [NightController::class, 'store']);
        Route::post('seasons/{season}/nights/import', [NightController::class, 'import']);
        Route::post('seasons/{season}/main-event/import', [MainEventController::class, 'import'])->middleware(RequireFeature::for(Feature::MainEvent));
        Route::get('seasons/{season}/night-plan', [SeasonController::class, 'nightPlan'])->middleware(RequireFeature::for(Feature::SeasonPlanner));
        Route::get('seasons/{season}/calendar', [SeasonController::class, 'calendar']);
        Route::post('seasons/{season}/nights/batch', [NightController::class, 'storeMany'])->middleware(RequireFeature::for(Feature::SeasonPlanner));

        Route::get('nights/{night}', [NightController::class, 'show']);
        Route::patch('nights/{night}', [NightController::class, 'update']);
        Route::post('nights/{night}/reschedule', [NightController::class, 'reschedule']);
        Route::post('nights/{night}/cancel', [NightController::class, 'cancel']);
        Route::post('nights/{night}/open', [NightController::class, 'open']);
        Route::post('nights/{night}/undo-open', [NightController::class, 'undoOpen']);
        Route::post('nights/{night}/finish', [NightController::class, 'finish']);
        Route::post('nights/{night}/main-event-result', [MainEventController::class, 'finish'])->middleware(RequireFeature::for(Feature::MainEvent));
        Route::get('nights/{night}/attendance', [AttendanceController::class, 'index']);
        Route::put('nights/{night}/attendance/{player}', [AttendanceController::class, 'update']);
        Route::delete('nights/{night}/attendance/{player}', [AttendanceController::class, 'destroy']);
        Route::get('nights/{night}/partial-result', [PartialResultController::class, 'show']);
        Route::put('nights/{night}/partial-result', [PartialResultController::class, 'update']);
        Route::middleware(RequireFeature::for(Feature::NightDashboard))->prefix('nights/{night}/dashboard')->group(function () {
            Route::get('', [NightDashboardController::class, 'show']);
            Route::patch('players/{player}', [NightDashboardController::class, 'markPlayer']);
            Route::delete('players/{player}', [NightDashboardController::class, 'removePlayer']);
            Route::post('players/{player}/rebuys', [NightDashboardController::class, 'addRebuy']);
            // A rebuy of another night is not found.
            Route::patch('rebuys/{rebuy}', [NightDashboardController::class, 'markRebuy'])->scopeBindings();
            Route::delete('rebuys/{rebuy}', [NightDashboardController::class, 'removeRebuy'])->scopeBindings();
            Route::put('house-owner', [NightDashboardController::class, 'setHouseOwner']);
            Route::put('positions/{position}', [NightDashboardController::class, 'setPosition'])->whereNumber('position');
            Route::put('main-event-pot', [NightDashboardController::class, 'setMainEventPot']);
            Route::put('amounts', [NightDashboardController::class, 'setAmounts']);
            Route::put('non-cash-adjustment', [NightDashboardController::class, 'setNonCashAdjustment']);
        });

        Route::get('statistics', [StatisticsController::class, 'show']);

        Route::get('players', [PlayerController::class, 'index']);
        Route::post('players', [PlayerController::class, 'store']);
        Route::post('players/quick-add', [PlayerController::class, 'quickAdd']);
        Route::get('players/{player}', [PlayerController::class, 'show']);
        Route::get('players/{player}/statistics', [PlayerStatisticsController::class, 'show']);
        Route::get('players/{player}/thumbnail', [PlayerController::class, 'thumbnail']);
        Route::get('players/{player}/photo', [PlayerController::class, 'photo']);
        // POST, not PUT: PHP reads an uploaded file only from a POST. The photo routes change the thumbnail too.
        Route::post('players/{player}/photo', [PlayerController::class, 'storePhoto']);
        Route::delete('players/{player}/photo', [PlayerController::class, 'destroyPhoto']);
        Route::patch('players/{player}', [PlayerController::class, 'update']);
        Route::put('players/{player}/login', [PlayerLoginController::class, 'update']);

        Route::get('places', [PlaceController::class, 'index']);
        Route::post('places', [PlaceController::class, 'store']);
        Route::patch('places/{place}', [PlaceController::class, 'update']);

        Route::get('holidays', [HolidayController::class, 'index']);
        Route::post('holidays', [HolidayController::class, 'store']);
        Route::patch('holidays/{holiday}', [HolidayController::class, 'update']);
        Route::get('holiday-calendar/{year}', [HolidayController::class, 'calendar'])->whereNumber('year');
        Route::post('holiday-exceptions', [HolidayController::class, 'storeException']);
        Route::delete('holiday-exceptions/{exception}', [HolidayController::class, 'destroyException']);

        Route::get('audit-log', [AuditLogController::class, 'index']);
    });
});
