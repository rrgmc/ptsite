<?php

namespace PTSite\Domain\Shared;

use DomainException;

/**
 * A business rule was broken. The code identifies the rule; the field, when set, names the input it concerns.
 * Messages shown to users are looked up from the code by the application layer.
 */
final class RuleViolation extends DomainException
{
    /** @param array<string, scalar> $context */
    public function __construct(
        public readonly string $rule,
        public readonly ?string $field = null,
        public readonly array $context = [],
    ) {
        parent::__construct($rule);
    }
}
