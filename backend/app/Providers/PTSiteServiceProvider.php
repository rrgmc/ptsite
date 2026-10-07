<?php

namespace PTSite\App\Providers;

use Dedoc\Scramble\Scramble;
use Dedoc\Scramble\Support\Generator\OpenApi;
use Dedoc\Scramble\Support\Generator\SecurityScheme;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Laravel\Sanctum\Sanctum;
use PTSite\App\Console\Commands\PrepareDatabase;
use PTSite\App\Console\Commands\VerifyLeague;
use PTSite\App\Models\User;
use PTSite\App\Support\TablePrefix;
use PTSite\Domain\Accounts\PasswordResetRules;

/**
 * The whole site as one Laravel package: its settings, API, single-page app routes, migrations, messages, mail
 * and commands. A host app needs only this provider, which Composer registers by itself, and the two calls of
 * PTSite\App\Bootstrap in its bootstrap/app.php.
 */
class PTSiteServiceProvider extends ServiceProvider
{
    /** The folder of the package: backend/. */
    private const ROOT = __DIR__.'/../..';

    public function register(): void
    {
        $this->mergeConfigFrom(self::ROOT.'/config/ptsite.php', 'ptsite');
        $this->configureHost();

        $this->app->bind(PasswordResetRules::class, fn () => new PasswordResetRules(
            config('ptsite.password_reset.site_domain'),
            config('ptsite.password_reset.blocked_domains'),
        ));
    }

    public function boot(): void
    {
        TablePrefix::assertValid((string) config('ptsite.database.table_prefix'));

        $this->loadMigrations();
        $this->loadViewsFrom(self::ROOT.'/resources/views', 'ptsite');
        $this->loadMessages();
        $this->loadRoutes();
        $this->commands([PrepareDatabase::class, VerifyLeague::class]);

        /*
         * The name stored with a login token, in place of the model's class name. "App\Models\User" is the name
         * a database has when its tokens were made by an app that kept the model in Laravel's usual place.
         */
        Relation::morphMap(['user' => User::class, 'App\Models\User' => User::class]);

        // The website is served from the same host as the API, so requests from the host itself always get
        // session authentication. SANCTUM_STATEFUL_DOMAINS adds others, such as the Vite dev server.
        config(['sanctum.stateful' => array_values(array_unique(array_filter([
            ...(array) config('sanctum.stateful', []),
            ltrim((string) Sanctum::currentRequestHost(), ','),
        ])))]);

        Scramble::configure()->withDocumentTransformers(function (OpenApi $openApi) {
            $openApi->secure(SecurityScheme::http('bearer'));
            // A fixed title: the spec is committed, so it must not change with a site's name.
            $openApi->info->title = 'PTSite API';
        });
    }

    /**
     * Puts this package's settings into the host app's own configuration. Each value is set, never added to,
     * so running this again (as a cached configuration does) changes nothing.
     */
    private function configureHost(): void
    {
        $connection = config('database.default');
        if (in_array(config("database.connections.{$connection}.driver"), ['mysql', 'mariadb'], true)) {
            config([
                "database.connections.{$connection}.database" => config('ptsite.database.name').config('ptsite.database.name_suffix'),
                "database.connections.{$connection}.prefix" => config('ptsite.database.table_prefix'),
            ]);
        }

        config([
            'auth.providers.users.model' => User::class,
            'auth.guards.web.remember' => config('ptsite.auth.remember_minutes'),
        ]);
    }

    /** The migrations, unless the host app is this package itself and already has them in its own folder. */
    private function loadMigrations(): void
    {
        $migrations = realpath(self::ROOT.'/database/migrations');
        if ($migrations !== realpath($this->app->databasePath('migrations'))) {
            $this->loadMigrationsFrom($migrations);
        }
    }

    /** The messages: lang/<locale>/{rules,auth,validation}.php. A host app's own lang folder comes first. */
    private function loadMessages(): void
    {
        $lang = realpath(self::ROOT.'/lang');
        if ($lang !== realpath($this->app->langPath())) {
            $this->callAfterResolving('translator', fn ($translator) => $translator->getLoader()->addPath($lang));
        }
    }

    private function loadRoutes(): void
    {
        if ($this->app->routesAreCached()) {
            return;
        }
        Route::middleware('api')->prefix('api')->group(self::ROOT.'/routes/api.php');
        // Last: it ends with the fallback that serves the single-page app.
        Route::middleware('web')->group(self::ROOT.'/routes/web.php');
    }
}
