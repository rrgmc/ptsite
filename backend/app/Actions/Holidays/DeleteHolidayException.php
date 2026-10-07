<?php

namespace PTSite\App\Actions\Holidays;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use PTSite\App\Models\HolidayException;
use PTSite\App\Models\User;
use PTSite\App\Support\AuditLogger;

/** Removes a one-year change to the holiday table (admins): the holiday is back that year, or the extra is gone. */
final class DeleteHolidayException
{
    public function __construct(private readonly AuditLogger $audit) {}

    public function __invoke(User $user, HolidayException $exception): void
    {
        Gate::forUser($user)->authorize('delete', $exception);

        DB::transaction(function () use ($user, $exception) {
            $before = SaveHolidayException::snapshot($exception);
            $exception->delete();
            $this->audit->record($user, 'holiday_exception.deleted', $exception, $before, null);
        });
    }
}
