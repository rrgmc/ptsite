<?php

namespace PTSite\App\Actions\Nights;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use PTSite\App\Models\Night;
use PTSite\App\Models\User;
use PTSite\App\Support\AuditLogger;

/**
 * "Editar evento": changes a night's place or description, whatever its status. The date, the amounts and the
 * results are not touched, so the standings stay the same.
 */
final class UpdateNight
{
    public function __construct(
        private readonly AuditLogger $audit,
    ) {}

    /** @param array{place_id?: ?int, description?: ?string} $data */
    public function __invoke(User $user, Night $night, array $data): Night
    {
        Gate::forUser($user)->authorize('update', $night);

        return DB::transaction(function () use ($user, $night, $data) {
            $before = NightSnapshot::of($night);
            $night->fill(array_intersect_key($data, array_flip(['place_id', 'description'])))->save();
            $this->audit->record($user, 'night.updated', $night, $before, NightSnapshot::of($night));

            return $night;
        });
    }
}
