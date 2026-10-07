<?php

namespace PTSite\App\Actions\Holidays;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use PTSite\App\Models\Holiday;
use PTSite\App\Models\User;
use PTSite\App\Support\AuditLogger;
use PTSite\App\Support\HolidayTable;
use PTSite\Domain\Shared\RuleViolation;

/** Creates or updates a holiday in the table (admins), or archives and restores it. */
final class SaveHoliday
{
    private const FIELDS = ['name', 'scope', 'month', 'day', 'easter_offset', 'first_year', 'last_year'];

    public function __construct(private readonly AuditLogger $audit) {}

    /**
     * @param array{name?: string, scope?: string, month?: ?int, day?: ?int, easter_offset?: ?int,
     *              first_year?: ?int, last_year?: ?int, archived?: bool} $data
     */
    public function __invoke(User $user, ?Holiday $holiday, array $data): Holiday
    {
        $holiday === null
            ? Gate::forUser($user)->authorize('create', Holiday::class)
            : Gate::forUser($user)->authorize('update', $holiday);

        return DB::transaction(function () use ($user, $holiday, $data) {
            $holiday ??= new Holiday;
            $before = $holiday->exists ? $this->snapshot($holiday) : null;
            $holiday->fill(array_intersect_key($data, array_flip(self::FIELDS)));
            // A holiday is either on a fixed date or based on Easter: setting one clears the other.
            if (array_key_exists('easter_offset', $data) && $data['easter_offset'] !== null) {
                if (($data['month'] ?? null) !== null || ($data['day'] ?? null) !== null) {
                    throw new RuleViolation('holiday.kind', 'easter_offset');
                }
                $holiday->month = $holiday->day = null;
            } elseif (($data['month'] ?? null) !== null || ($data['day'] ?? null) !== null) {
                $holiday->easter_offset = null;
            }
            if ($holiday->easter_offset === null && ($holiday->month === null || $holiday->day === null)) {
                throw new RuleViolation('holiday.kind', 'month');
            }
            HolidayTable::rule($holiday);
            if (array_key_exists('archived', $data)) {
                $holiday->archived_at = $data['archived'] ? ($holiday->archived_at ?? now()) : null;
            }
            $holiday->save();
            $this->audit->record($user, $before === null ? 'holiday.created' : 'holiday.updated', $holiday, $before, $this->snapshot($holiday));

            return $holiday;
        });
    }

    /** @return array<string, mixed> */
    private function snapshot(Holiday $holiday): array
    {
        return [...$holiday->only(self::FIELDS), 'archived_at' => $holiday->archived_at?->toIso8601String()];
    }
}
