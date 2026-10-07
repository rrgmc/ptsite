<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use PTSite\Domain\Shared\RuleViolation;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // The website on the same domain logs in with a session cookie; other clients use tokens.
        $middleware->statefulApi();
        // There is no "login" route: the app has its own login page. API requests get a 401 instead of a redirect.
        $middleware->redirectGuestsTo(fn (Request $request) => $request->is('api/*') ? null : url('app/login'));
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        // A broken business rule: 409 for a state conflict (opening, finishing, moving or cancelling a night, or
        // saving its partial result, at the wrong time), otherwise 422.
        // Same body shape as Laravel's validation errors, with the message in Brazilian Portuguese.
        $exceptions->render(function (RuleViolation $e) {
            $message = __("rules.{$e->rule}", $e->context);
            $conflicts = ['night.open.', 'night.finish.', 'night.reschedule.', 'night.cancel.', 'night.partial_result.'];
            $status = collect($conflicts)->contains(fn ($prefix) => str_starts_with($e->rule, $prefix)) ? 409 : 422;

            return response()->json([
                'message' => $message,
                'rule' => $e->rule,
                'errors' => $e->field ? [$e->field => [$message]] : (object) [],
            ], $status);
        });
    })->create();
