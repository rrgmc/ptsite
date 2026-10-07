<?php

namespace PTSite\App\Support;

use RuntimeException;

/**
 * The site's settings file, site.json (site/README.md). The frontend is built from the same file, so the two ends
 * agree on the site's name, language and time zone.
 */
final class SiteFile
{
    /**
     * The file's settings, or an empty list when there is no file: the app then takes them from .env alone.
     *
     * The file is looked for in the app's own folder, where the deploy package puts it, and then in the site
     * folder next to it. PTSITE_SITE_DIR names another site folder.
     *
     * @return array<string, mixed>
     */
    public static function read(string $basePath, ?string $siteDir = null): array
    {
        $candidates = $siteDir !== null && $siteDir !== ''
            ? [rtrim($siteDir, '/\\').'/site.json']
            : [$basePath.'/site.json', dirname($basePath).'/site/site.json'];

        foreach ($candidates as $file) {
            if (is_file($file)) {
                $settings = json_decode((string) file_get_contents($file), true);
                if (! is_array($settings)) {
                    throw new RuntimeException("{$file} is not a JSON object.");
                }

                return $settings;
            }
        }
        if ($siteDir !== null && $siteDir !== '') {
            throw new RuntimeException("No site.json in {$siteDir} (PTSITE_SITE_DIR).");
        }

        return [];
    }

    /**
     * The folder of messages for a language as the file and browsers write it: "pt-BR" is lang/pt_BR. A
     * language with no folder of its own takes one of the same language ("pt-PT" takes pt_BR), or else English.
     */
    public static function laravelLocale(string $locale, string $langPath): string
    {
        $wanted = str_replace('-', '_', $locale);
        $folders = array_map('basename', glob($langPath.'/*', GLOB_ONLYDIR) ?: []);
        if (in_array($wanted, $folders, true)) {
            return $wanted;
        }
        $language = strtolower(explode('_', $wanted)[0]);
        foreach ($folders as $folder) {
            if (strtolower(explode('_', $folder)[0]) === $language) {
                return $folder;
            }
        }

        return 'en';
    }
}
