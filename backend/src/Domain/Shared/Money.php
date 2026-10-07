<?php

namespace PTSite\Domain\Shared;

use InvalidArgumentException;

/**
 * An amount in Brazilian reais, stored as whole cents to avoid float rounding.
 */
final readonly class Money
{
    private function __construct(public int $cents) {}

    public static function cents(int $cents): self
    {
        return new self($cents);
    }

    public static function zero(): self
    {
        return new self(0);
    }

    /** Parses a decimal string such as "840.00", "840" or "12.5". */
    public static function fromDecimal(string|int|float $amount): self
    {
        $text = is_string($amount) ? trim($amount) : number_format((float) $amount, 2, '.', '');
        if (! preg_match('/^(-?)(\d+)(?:\.(\d{1,2}))?$/', $text, $m)) {
            throw new InvalidArgumentException("Invalid money amount: {$text}");
        }
        $cents = ((int) $m[2]) * 100 + (int) str_pad($m[3] ?? '0', 2, '0');

        return new self($m[1] === '-' ? -$cents : $cents);
    }

    public function toDecimal(): string
    {
        $sign = $this->cents < 0 ? '-' : '';
        $abs = abs($this->cents);

        return sprintf('%s%d.%02d', $sign, intdiv($abs, 100), $abs % 100);
    }

    public function plus(self $other): self
    {
        return new self($this->cents + $other->cents);
    }

    public function minus(self $other): self
    {
        return new self($this->cents - $other->cents);
    }

    /** This amount times percent ÷ 100, rounded half up to the cent. */
    public function percent(int $percent): self
    {
        return new self(intdiv($this->cents * $percent * 2 + 100, 200));
    }

    public function isZero(): bool
    {
        return $this->cents === 0;
    }

    public function isPositive(): bool
    {
        return $this->cents > 0;
    }

    public function equals(self $other): bool
    {
        return $this->cents === $other->cents;
    }

    public function compare(self $other): int
    {
        return $this->cents <=> $other->cents;
    }
}
