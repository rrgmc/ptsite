<?php

namespace PTSite\Domain\Accounts;

use DateTimeInterface;
use PTSite\Domain\Shared\RuleViolation;

/** Rules for the password link sent by email (docs/specs/accounts-and-roles.md, rule 12). */
final class PasswordResetRules
{
    /** @var list<string> */
    private readonly array $refusedDomains;

    /**
     * @param  string  $siteDomain  the site's own domain: an address on it is a placeholder for a player with no email
     * @param  list<string>  $blockedDomains  other invented domains
     */
    public function __construct(string $siteDomain, array $blockedDomains)
    {
        $this->refusedDomains = array_values(array_filter(array_map(
            fn (string $domain) => strtolower(trim($domain)),
            [$siteDomain, ...$blockedDomains],
        )));
    }

    /** An address may get a link unless it is empty, malformed, or on a refused domain or one of its subdomains. */
    public function isUsableAddress(?string $email): bool
    {
        $email = trim((string) $email);
        if ($email === '' || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
            return false;
        }

        $domain = strtolower(substr($email, strrpos($email, '@') + 1));
        foreach ($this->refusedDomains as $refused) {
            if ($domain === $refused || str_ends_with($domain, '.'.$refused)) {
                return false;
            }
        }

        return true;
    }

    public function assertUsableAddress(?string $email): void
    {
        if (! $this->isUsableAddress($email)) {
            throw new RuleViolation('password_reset.no_usable_email', 'login');
        }
    }

    /** A link works until it expires. A link that was used or replaced no longer exists, so it has no expiry. */
    public function assertUsable(?DateTimeInterface $expiresAt, DateTimeInterface $now): void
    {
        if ($expiresAt === null) {
            throw new RuleViolation('password_reset.invalid_link');
        }
        if ($expiresAt <= $now) {
            throw new RuleViolation('password_reset.expired');
        }
    }

    /** The address as shown after sending: "maria@gmail.com" becomes "m•••@gmail.com". */
    public function mask(string $email): string
    {
        $at = strrpos($email, '@');

        return mb_substr($email, 0, 1).'•••'.substr($email, $at);
    }
}
