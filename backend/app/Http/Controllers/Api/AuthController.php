<?php

namespace PTSite\App\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Laravel\Sanctum\PersonalAccessToken;
use PTSite\App\Actions\Auth\ChangeOwnPassword;
use PTSite\App\Actions\Auth\LogIn;
use PTSite\App\Http\Controllers\Controller;
use PTSite\App\Http\Requests\ChangeOwnPasswordRequest;
use PTSite\App\Http\Requests\CreateTokenRequest;
use PTSite\App\Http\Requests\LoginRequest;
use PTSite\App\Http\Resources\UserResource;

class AuthController extends Controller
{
    /**
     * Log in with a session cookie (the website). Call GET /sanctum/csrf-cookie first.
     *
     * @unauthenticated
     */
    public function login(LoginRequest $request, LogIn $logIn): UserResource
    {
        $user = $logIn($request->validated('username'), $request->validated('password'));
        Auth::guard('web')->login($user, (bool) $request->validated('remember', false));
        $request->session()->regenerate();

        return new UserResource($user->load('player'));
    }

    /** Log out of the session. */
    public function logout(Request $request): Response
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->noContent();
    }

    /**
     * Create an API token for another client, such as a phone app.
     *
     * @unauthenticated
     */
    public function createToken(CreateTokenRequest $request, LogIn $logIn): JsonResponse
    {
        $user = $logIn($request->validated('username'), $request->validated('password'));

        return response()->json([
            'token' => $user->createToken($request->validated('device_name'))->plainTextToken,
            'user' => new UserResource($user->load('player')),
        ], 201);
    }

    /**
     * Change the logged-in user's own password. Needs the current password.
     * The user's other API tokens stop working.
     */
    public function changePassword(ChangeOwnPasswordRequest $request, ChangeOwnPassword $change): Response
    {
        $token = $request->user()->currentAccessToken();
        $change(
            $request->user(),
            $request->validated('current_password'),
            $request->validated('password'),
            $token instanceof PersonalAccessToken ? $token->getKey() : null,
        );

        return response()->noContent();
    }

    /** The logged-in user, their player and what they may do. */
    public function me(Request $request): UserResource
    {
        return new UserResource($request->user()->load('player'));
    }
}
