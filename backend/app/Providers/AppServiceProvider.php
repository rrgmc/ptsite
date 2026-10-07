<?php

namespace PTSite\App\Providers;

use Dedoc\Scramble\Scramble;
use Dedoc\Scramble\Support\Generator\OpenApi;
use Dedoc\Scramble\Support\Generator\SecurityScheme;
use Illuminate\Support\ServiceProvider;
use PTSite\Domain\Accounts\PasswordResetRules;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(PasswordResetRules::class, fn () => new PasswordResetRules(
            config('password_reset.site_domain'),
            config('password_reset.blocked_domains'),
        ));
    }

    public function boot(): void
    {
        Scramble::configure()->withDocumentTransformers(function (OpenApi $openApi) {
            $openApi->secure(SecurityScheme::http('bearer'));
            // A fixed title: the spec is committed, so it must not change with a site's name.
            $openApi->info->title = 'PTSite API';
        });
    }
}
