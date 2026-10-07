<?php

/*
 * The site's messages exist in every language of lang/. Brazilian Portuguese is the reference.
 */

use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;
use PTSite\App\Mail\PasswordResetMail;
use PTSite\App\Models\Night;
use PTSite\App\Models\Season;
use PTSite\App\Models\User;

/** @return list<string> every key of a file of messages, with nested keys joined by dots */
function messageKeys(string $locale, string $file): array
{
    $keys = array_keys(Arr::dot(require lang_path("{$locale}/{$file}.php")));
    sort($keys);

    return $keys;
}

it('has every rule and mail message in English too', function (string $file) {
    expect(messageKeys('en', $file))->toBe(messageKeys('pt_BR', $file));
})->with(['rules', 'mail']);

it('has the messages of this site\'s own in every language', function (string $key) {
    foreach (['en', 'pt_BR'] as $locale) {
        expect(trans($key, [], $locale))->not->toBe($key);
    }
})->with(['auth.failed', 'auth.disabled', 'auth.throttle']);

it('has a message for every rule the code can break', function () {
    $messages = require lang_path('pt_BR/rules.php');
    $missing = [];
    foreach ([base_path('src'), base_path('app')] as $folder) {
        foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($folder, FilesystemIterator::SKIP_DOTS)) as $file) {
            preg_match_all("/new RuleViolation\('([a-z_.]+)'/", file_get_contents($file->getPathname()), $found);
            foreach ($found[1] as $rule) {
                if (! isset($messages[$rule])) {
                    $missing[] = $rule;
                }
            }
        }
    }

    expect(array_values(array_unique($missing)))->toBe([]);
});

it('answers a broken rule in English when that is the site\'s language', function () {
    app()->setLocale('en');
    Sanctum::actingAs(User::factory()->resultsKeeper()->create());
    $season = Season::factory()->create();
    Night::factory()->open()->create(['season_id' => $season->id]);
    $night = Night::factory()->create(['season_id' => $season->id]);

    $this->postJson("/api/v1/nights/{$night->id}/open")
        ->assertStatus(409)
        ->assertJsonPath('rule', 'night.open.another_open')
        ->assertJsonPath('message', 'This season already has an open night. Finish it before opening another one.');
});

it('writes a taken date as the site\'s language does', function (string $locale, string $date) {
    app()->setLocale($locale);
    Sanctum::actingAs(User::factory()->resultsKeeper()->create());
    $season = Season::factory()->create();
    Night::factory()->create(['season_id' => $season->id, 'starts_at' => '2026-03-14 21:00:00']);
    $other = Night::factory()->create(['season_id' => $season->id, 'starts_at' => '2026-03-28 21:00:00']);

    $this->postJson("/api/v1/nights/{$other->id}/reschedule", ['starts_at' => '2026-03-14T21:00:00-03:00'])
        ->assertUnprocessable()
        ->assertJsonPath('rule', 'night.date_taken')
        ->assertJsonPath('message', fn (string $message) => str_contains($message, $date));
})->with([['pt_BR', '14/03/2026'], ['en', '03/14/2026']]);

it('writes the password mail in English when that is the site\'s language', function () {
    app()->setLocale('en');
    config(['app.name' => 'Demo League']);
    Mail::fake();

    (new PasswordResetMail([['username' => 'ana', 'url' => 'https://league.example/app/reset-password?token=x']], 60))
        ->assertHasSubject('Demo League: reset your password')
        ->assertSeeInOrderInText(['reset the password of the user ana on the Demo League site', 'works for 60 minutes'])
        ->assertSeeInHtml('<strong>ana</strong>', false);
});
