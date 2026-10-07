<?php

/*
 * Mirrors the rules in docs/specs/attendance.md that do not need a database. The ordering and permission examples
 * are covered in tests/Feature/AttendanceTest.php.
 */

use PTSite\Domain\Attendance\AttendanceAnswer;
use PTSite\Domain\Attendance\AttendanceRules;
use PTSite\Domain\Nights\NightStatus;
use PTSite\Domain\Shared\RuleViolation;

it('takes answers only while the night is open', function (NightStatus $status, bool $archived, ?string $refusal) {
    $check = fn () => (new AttendanceRules)->assertOpenForAnswers($status, $archived);
    $refusal === null ? expect($check)->not->toThrow(RuleViolation::class) : expect($check)->toThrow(RuleViolation::class, $refusal);
})->with([
    'scheduled' => [NightStatus::Scheduled, false, 'attendance.not_open'],
    'open' => [NightStatus::Open, false, null],
    'finished' => [NightStatus::Finished, false, 'attendance.closed'],
    'archived' => [NightStatus::Scheduled, true, 'attendance.closed'],
]);

it('treats repeating the same answer as no change, so nobody loses their place', function () {
    $rules = new AttendanceRules;
    expect($rules->changes(AttendanceAnswer::AllIn, AttendanceAnswer::AllIn))->toBeFalse()
        ->and($rules->changes(AttendanceAnswer::AllIn, AttendanceAnswer::Fold))->toBeTrue()
        ->and($rules->changes(null, AttendanceAnswer::AllIn))->toBeTrue()
        ->and($rules->changes(AttendanceAnswer::Fold, null))->toBeTrue();
});
