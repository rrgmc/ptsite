<?php

namespace PTSite\App\Actions\Nights;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use PTSite\App\Models\Night;
use PTSite\App\Models\User;
use PTSite\App\Support\AuditLogger;
use PTSite\Domain\Nights\NightType;

/**
 * "Editar evento": changes a night's place or description, or whether it is extra, whatever its status. The
 * date, the amounts and the results are not touched, so the standings stay the same. A Main Event night stays
 * extra.
 */
final class UpdateNight
{
    public function __construct(
        private readonly AuditLogger $audit,
    ) {}

    /** @param array{place_id?: ?int, description?: ?string, is_extra?: bool} $data */
    public function __invoke(User $user, Night $night, array $data): Night
    {
        Gate::forUser($user)->authorize('update', $night);

        return DB::transaction(function () use ($user, $night, $data) {
            $before = NightSnapshot::of($night);
            $fields = $night->type === NightType::MainEvent->value ? ['place_id', 'description'] : ['place_id', 'description', 'is_extra'];
            $night->fill(array_intersect_key($data, array_flip($fields)))->save();
            $this->audit->record($user, 'night.updated', $night, $before, NightSnapshot::of($night));

            return $night;
        });
    }
}
