<?php

/*
 * The site's settings file, site.json (site/README.md). This app's own is the demo site's, in ../site.
 */

use PTSite\App\Mail\PasswordResetMail;
use PTSite\App\Support\SiteFile;

it('takes the site\'s name, language and time zone from site.json', function () {
    $site = json_decode(file_get_contents(base_path('../site/site.json')), true);

    expect(config('app.name'))->toBe($site['name'])
        ->and(config('mail.from.name'))->toBe($site['name'])
        ->and(config('app.locale'))->toBe(str_replace('-', '_', $site['locale']))
        ->and(config('app.timezone'))->toBe($site['timeZone'])
        ->and(date_default_timezone_get())->toBe($site['timeZone'])
        ->and(config('ptsite.tagline'))->toBe($site['tagline']);
});

it('signs its mail with the site\'s name and tagline', function () {
    config(['app.name' => 'Clube Exemplo', 'ptsite.tagline' => 'Toda sexta']);
    $mail = new PasswordResetMail([['username' => 'ana', 'url' => 'https://clube.example/app/reset-password?token=x']], 60);

    $mail->assertHasSubject('Clube Exemplo: redefinir a senha')
        ->assertSeeInText('no site Clube Exemplo.')
        ->assertSeeInText('Clube Exemplo - Toda sexta');

    config(['ptsite.tagline' => '']);
    (new PasswordResetMail([['username' => 'ana', 'url' => 'https://clube.example/x']], 60))
        ->assertDontSeeInText('Clube Exemplo -');
});

it('reads the file from the app\'s own folder first, then from the site folder next to it', function () {
    $root = sys_get_temp_dir().'/ptsite-sitefile-'.bin2hex(random_bytes(4));
    mkdir("{$root}/backend", 0777, true);
    mkdir("{$root}/site");
    mkdir("{$root}/other");

    expect(SiteFile::read("{$root}/backend"))->toBe([]);

    file_put_contents("{$root}/site/site.json", '{"name": "Do lado"}');
    expect(SiteFile::read("{$root}/backend"))->toBe(['name' => 'Do lado']);

    file_put_contents("{$root}/backend/site.json", '{"name": "Da pasta"}');
    expect(SiteFile::read("{$root}/backend"))->toBe(['name' => 'Da pasta']);

    file_put_contents("{$root}/other/site.json", '{"name": "Outra"}');
    expect(SiteFile::read("{$root}/backend", "{$root}/other"))->toBe(['name' => 'Outra']);

    expect(fn () => SiteFile::read("{$root}/backend", "{$root}/missing"))->toThrow(RuntimeException::class);

    array_map('unlink', ["{$root}/site/site.json", "{$root}/backend/site.json", "{$root}/other/site.json"]);
    array_map('rmdir', ["{$root}/site", "{$root}/backend", "{$root}/other", $root]);
});

it('finds the folder of messages for a language', function (string $locale, string $folder) {
    expect(SiteFile::laravelLocale($locale, lang_path()))->toBe($folder);
})->with([
    'its own folder' => ['pt-BR', 'pt_BR'],
    'English' => ['en', 'en'],
    'another country, same language' => ['pt-PT', 'pt_BR'],
    'English of a country' => ['en-US', 'en'],
    'a language with no messages' => ['fr-FR', 'en'],
]);
