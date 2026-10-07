<?php

namespace PTSite\App\Actions\Places;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use PTSite\App\Models\Place;
use PTSite\App\Models\User;
use PTSite\App\Support\AuditLogger;

/** Creates or updates a place (admins), or archives and restores it. */
final class SavePlace
{
    public function __construct(private readonly AuditLogger $audit) {}

    /** @param array{name?: string, address?: ?string, archived?: bool} $data */
    public function __invoke(User $user, ?Place $place, array $data): Place
    {
        $place === null
            ? Gate::forUser($user)->authorize('create', Place::class)
            : Gate::forUser($user)->authorize('update', $place);

        return DB::transaction(function () use ($user, $place, $data) {
            $place ??= new Place;
            $before = $place->exists ? $place->only(['name', 'address', 'archived_at']) : null;
            $place->fill(array_intersect_key($data, array_flip(['name', 'address'])));
            if (array_key_exists('archived', $data)) {
                $place->archived_at = $data['archived'] ? ($place->archived_at ?? now()) : null;
            }
            $place->save();
            $this->audit->record($user, $before === null ? 'place.created' : 'place.updated', $place, $before, $place->only(['name', 'address', 'archived_at']));

            return $place;
        });
    }
}
