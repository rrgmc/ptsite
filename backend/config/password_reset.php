<?php

// The password link sent by email (docs/specs/accounts-and-roles.md, rule 12).
return [

    // How long a link works, in minutes.
    'expire_minutes' => (int) env('PASSWORD_RESET_EXPIRE', 60),

    // How long a user waits before asking for another link, in seconds.
    'resend_seconds' => 60,

    // Link requests allowed per minute per client (raised for end-to-end tests).
    'attempts_per_minute' => (int) env('PASSWORD_RESET_THROTTLE', 5),

    // The site's own domain. An address on it, or on a subdomain, never gets a link. Empty: no such check.
    'site_domain' => (string) env('PASSWORD_RESET_SITE_DOMAIN', ''),

    /*
     * Domains that never get a link: placeholders people type for a player who gave no email. Some of them
     * belong to strangers. PASSWORD_RESET_BLOCKED_DOMAINS (comma separated) adds domains; it never removes one.
     */
    'blocked_domains' => [
        'email.com',
        'email.com.br',
        ...array_filter(array_map('trim', explode(',', (string) env('PASSWORD_RESET_BLOCKED_DOMAINS', '')))),
    ],

];
