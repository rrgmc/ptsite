<?php

use PTSite\Domain\Shared\Money;

it('parses and prints decimal amounts', function (string $input, string $output) {
    expect(Money::fromDecimal($input)->toDecimal())->toBe($output);
})->with([
    ['840.00', '840.00'],
    ['840', '840.00'],
    ['12.5', '12.50'],
    ['0.05', '0.05'],
]);

it('rejects amounts that are not decimals', function (string $input) {
    Money::fromDecimal($input);
})->with(['abc', '1,50', '1.234'])->throws(InvalidArgumentException::class);

it('takes a percentage rounding half up to the cent', function () {
    expect(Money::fromDecimal('0.50')->percent(5)->toDecimal())->toBe('0.03') // 2.5 cents
        ->and(Money::fromDecimal('0.10')->percent(38)->toDecimal())->toBe('0.04'); // 3.8 cents
});

it('multiplies an amount by a count', function () {
    expect(Money::fromDecimal('12.50')->times(3)->toDecimal())->toBe('37.50')
        ->and(Money::fromDecimal('12.50')->times(0)->toDecimal())->toBe('0.00');
});

it('rounds half up to a whole unit', function (string $amount, string $rounded) {
    expect(Money::fromDecimal($amount)->roundedToUnit()->toDecimal())->toBe($rounded);
})->with([
    ['63.75', '64.00'],
    ['63.50', '64.00'],
    ['63.49', '63.00'],
    ['85.00', '85.00'],
]);
