<?php

namespace PTSite\Domain\Nights;

use PTSite\Domain\Shared\Money;

/**
 * An amount that is owed and how much of it was paid.
 */
final readonly class MoneyTotal
{
    public function __construct(public Money $owed, public Money $paid) {}

    public static function zero(): self
    {
        return new self(Money::zero(), Money::zero());
    }

    /** Adds an amount that is owed, and counts it as paid when it was. */
    public function with(Money $amount, bool $paid): self
    {
        return new self($this->owed->plus($amount), $paid ? $this->paid->plus($amount) : $this->paid);
    }

    public function plus(self $other): self
    {
        return new self($this->owed->plus($other->owed), $this->paid->plus($other->paid));
    }

    public function pending(): Money
    {
        return $this->owed->minus($this->paid);
    }
}
