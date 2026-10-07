<?php

namespace PTSite\App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use PTSite\App\Models\PasswordReset;

/** @mixin PasswordReset */
class PasswordResetResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            /** The account whose password the link changes. */
            'username' => $this->user->username,
            'expires_at' => $this->expires_at->toIso8601String(),
        ];
    }
}
