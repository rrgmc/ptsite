<?php

/*
 * Settings of this site. Everything a league changes without touching the code is here or in .env.
 *
 * The package merges this file into the host app's configuration, so a site only names what it changes.
 */

use PTSite\App\Support\SiteFile;

// The site folder's site.json (site/README.md), which the frontend is built from too. Without the file, the
// name, language and time zone are Laravel's own settings: APP_NAME, APP_LOCALE and APP_TIMEZONE.
$site = SiteFile::read(base_path(), env('PTSITE_SITE_DIR'));

return [

    // From site.json. The package puts each one that is set into Laravel's own configuration.
    'site' => [
        'name' => $site['name'] ?? null,
        'locale' => isset($site['locale']) ? SiteFile::laravelLocale($site['locale']) : null,
        'time_zone' => $site['timeZone'] ?? null,
    ],

    // A line below the site name, in the mail signature. Empty: the name alone.
    'tagline' => $site['tagline'] ?? env('PTSITE_TAGLINE', ''),

    'database' => [
        // The name of the MySQL database.
        'name' => env('DB_DATABASE', 'ptsite'),

        // Added to the name. It gives the tests databases of their own next to the development one: "_test"
        // for Pest (phpunit.xml) and "_e2e_…" for each end-to-end server (frontend/scripts/e2e-server.mjs).
        'name_suffix' => env('DB_DATABASE_SUFFIX', ''),

        // A prefix for every table name, such as "liga_", so two sites can share one database. Empty: none.
        'table_prefix' => env('DB_TABLE_PREFIX', ''),
    ],

    'auth' => [
        // "Lembrar de mim" keeps a login for this many minutes: 30 days.
        'remember_minutes' => 60 * 24 * 30,

        // Login and token requests allowed per minute per client (raised for end-to-end tests).
        'login_attempts_per_minute' => (int) env('LOGIN_THROTTLE', 10),
    ],

    // The password link sent by email (docs/specs/accounts-and-roles.md, rule 12).
    'password_reset' => [
        // How long a link works, in minutes.
        'expire_minutes' => (int) env('PASSWORD_RESET_EXPIRE', 60),

        // How long a user waits before asking for another link, in seconds.
        'resend_seconds' => 60,

        // Link requests allowed per minute per client (raised for end-to-end tests).
        'attempts_per_minute' => (int) env('PASSWORD_RESET_THROTTLE', 5),

        // The site's own domain. An address on it, or on a subdomain, never gets a link. Empty: no such check.
        // PASSWORD_RESET_SITE_DOMAIN, or else "siteDomain" of site.json.
        'site_domain' => (string) env('PASSWORD_RESET_SITE_DOMAIN', $site['siteDomain'] ?? ''),

        /*
         * Domains that never get a link: placeholders people type for a player who gave no email. Some of them
         * belong to strangers. PASSWORD_RESET_BLOCKED_DOMAINS (comma separated) adds domains; it never removes
         * one.
         */
        'blocked_domains' => [
            'email.com',
            'email.com.br',
            ...array_filter(array_map('trim', explode(',', (string) env('PASSWORD_RESET_BLOCKED_DOMAINS', '')))),
        ],
    ],

    'holidays' => [
        /*
         * The holidays a new database starts with: a name from PTSite\Domain\Calendar\HolidayPresets, or the
         * name of a class that implements PTSite\Domain\Calendar\HolidayPreset. Empty: the table starts empty.
         * Admins edit the table afterwards, so changing this later does not change an existing database.
         */
        'preset' => env('PTSITE_HOLIDAY_PRESET'),
    ],

];
