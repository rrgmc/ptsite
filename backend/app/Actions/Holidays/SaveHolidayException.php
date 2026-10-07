<?php

namespace PTSite\App\Actions\Holidays;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use PTSite\App\Models\Holiday;
use PTSite\App\Models\HolidayException;
use PTSite\App\Models\User;
use PTSite\App\Support\AuditLogger;
use PTSite\App\Support\HolidayTable;
use PTSite\Domain\Shared\RuleViolation;

/**
 * Adds a change to the holiday table for one year (admins): a holiday that will not happen that year, or an extra
 * holiday on a date.
 */
final class SaveHolidayException
{
    public function __construct(private readonly AuditLogger $audit) {}

    /** @param array{year: int, holiday_id?: ?int, date?: ?string, name?: ?string} $data */
    public function __invoke(User $user, array $data): HolidayException
    {
        Gate::forUser($user)->authorize('create', Holiday::class);

        return DB::transaction(function () use ($user, $data) {
            $exception = new HolidayException(array_intersect_key($data, array_flip(['year', 'holiday_id', 'date', 'name'])));
            if ($exception->holiday_id !== null) {
                $exception->date = $exception->name = null;
                if (HolidayException::query()->where('year', $exception->year)->where('holiday_id', $exception->holiday_id)->exists()) {
                    throw new RuleViolation('holiday_exception.exists', 'holiday_id');
                }
            }
            HolidayTable::exception($exception);
            $exception->save();
            $this->audit->record($user, 'holiday_exception.created', $exception, null, $this->snapshot($exception));

            return $exception;
        });
    }

    /** @return array<string, mixed> */
    public static function snapshot(HolidayException $exception): array
    {
        return [
            'year' => $exception->year,
            'holiday_id' => $exception->holiday_id,
            'date' => $exception->date?->toDateString(),
            'name' => $exception->name,
        ];
    }
}
