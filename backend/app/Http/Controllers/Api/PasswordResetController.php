<?php

namespace PTSite\App\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use PTSite\App\Actions\Auth\RequestPasswordReset;
use PTSite\App\Actions\Auth\ResetPassword;
use PTSite\App\Http\Controllers\Controller;
use PTSite\App\Http\Requests\CompletePasswordResetRequest;
use PTSite\App\Http\Requests\RequestPasswordResetRequest;
use PTSite\App\Http\Resources\PasswordResetResource;
use PTSite\App\Queries\PendingPasswordReset;

class PasswordResetController extends Controller
{
    /**
     * Send a password link to the email of an account, for a user who forgot the password.
     * Some addresses never get a link: the answer then tells the user to ask an admin.
     *
     * @unauthenticated
     */
    public function store(RequestPasswordResetRequest $request, RequestPasswordReset $send): JsonResponse
    {
        return response()->json(['data' => [
            /** The address the link went to, with most of its name hidden: "m•••@example.com". */
            'email' => $send($request->validated('login')),
        ]]);
    }

    /**
     * The account behind a password link, when the link still works.
     *
     * @unauthenticated
     */
    public function show(string $token, PendingPasswordReset $pending): PasswordResetResource
    {
        return new PasswordResetResource($pending($token));
    }

    /**
     * Set a new password with a password link. The link stops working and every login of the account ends.
     *
     * @unauthenticated
     */
    public function complete(string $token, CompletePasswordResetRequest $request, ResetPassword $reset): Response
    {
        $reset($token, $request->validated('password'));

        return response()->noContent();
    }
}
