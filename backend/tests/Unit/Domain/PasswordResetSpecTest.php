<?php

/*
 * Mirrors the examples of rule 12 in docs/specs/accounts-and-roles.md that need no database. The others are
 * covered in tests/Feature/PasswordResetTest.php.
 */

use PTSite\Domain\Accounts\PasswordResetRules;
use PTSite\Domain\Shared\RuleViolation;

function passwordResetRules(): PasswordResetRules
{
    return new PasswordResetRules('ligademo.example', ['inventado.example', 'semdominio.example']);
}

it('sends a link to a real address, whatever its capitals', function (string $email) {
    expect(passwordResetRules()->isUsableAddress($email))->toBeTrue();
})->with(['maria@example.com', 'Maria@EXAMPLE.com']);

it('never sends a link to the site\'s domain, an invented domain or a missing address', function (?string $email) {
    expect(passwordResetRules()->isUsableAddress($email))->toBeFalse()
        ->and(fn () => passwordResetRules()->assertUsableAddress($email))
        ->toThrow(RuleViolation::class, 'password_reset.no_usable_email');
})->with([
    'the site\'s domain' => ['joao@ligademo.example'],
    'a subdomain of the site' => ['x@sub.ligademo.example'],
    'the site\'s domain in capitals' => ['Joao@LIGADEMO.example'],
    'an invented domain' => ['nada@inventado.example'],
    'a subdomain of an invented domain' => ['x@liga.semdominio.example'],
    'no address' => [null],
    'an empty address' => [''],
    'not an address' => ['sem-arroba'],
]);

it('does not refuse a domain that only ends like a refused one', function () {
    expect(passwordResetRules()->isUsableAddress('ana@notligademo.example'))->toBeTrue();
});

it('accepts a link for 60 minutes', function () {
    $asked = new DateTimeImmutable('2026-10-04 20:00:00');
    $expires = $asked->modify('+60 minutes');
    $rules = passwordResetRules();

    expect(fn () => $rules->assertUsable($expires, $asked->modify('+59 minutes')))->not->toThrow(RuleViolation::class)
        ->and(fn () => $rules->assertUsable($expires, $asked->modify('+61 minutes')))
        ->toThrow(RuleViolation::class, 'password_reset.expired');
});

it('refuses a link that was used or never existed', function () {
    expect(fn () => passwordResetRules()->assertUsable(null, new DateTimeImmutable))
        ->toThrow(RuleViolation::class, 'password_reset.invalid_link');
});

it('hides most of the name of the address it shows', function () {
    expect(passwordResetRules()->mask('maria@example.com'))->toBe('m•••@example.com');
});
