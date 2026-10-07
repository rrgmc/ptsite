<?php

/*
 * A user who forgot the password gets a link by email, following docs/specs/accounts-and-roles.md (rule 12).
 */

use Illuminate\Mail\MailManager;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use PTSite\App\Actions\Auth\ResetPassword;
use PTSite\App\Mail\PasswordResetMail;
use PTSite\App\Models\AuditLog;
use PTSite\App\Models\PasswordReset;
use PTSite\App\Models\Player;
use PTSite\App\Models\User;
use Symfony\Component\Mailer\Exception\TransportException;
use Symfony\Component\Mailer\SentMessage;
use Symfony\Component\Mailer\Transport\AbstractTransport;

beforeEach(function () {
    Mail::fake();
    config([
        'app.name' => 'Liga Demo',
        'password_reset.site_domain' => 'ligademo.example',
        'password_reset.blocked_domains' => ['inventado.example', 'semdominio.example'],
    ]);
});

/** A user linked to a player with this email. The account's own email is another one, as after an import from another site. */
function userWithPlayerEmail(string $username, ?string $email, array $attributes = []): User
{
    $player = Player::factory()->create(['email' => $email]);

    return User::factory()->create(['username' => $username, 'player_id' => $player->id, 'email' => 'antigo@gmail.com', ...$attributes]);
}

/** @return array<string, string> username => token, from the one message that was sent */
function sentTokens(): array
{
    $tokens = [];
    Mail::assertSentCount(1);
    Mail::assertSent(PasswordResetMail::class, function (PasswordResetMail $mail) use (&$tokens) {
        foreach ($mail->links as $link) {
            $tokens[$link['username']] = substr($link['url'], strpos($link['url'], '?token=') + 7);
        }

        return true;
    });

    return $tokens;
}

it('sends a link to the player\'s email when asked by username', function () {
    $maria = userWithPlayerEmail('maria', 'maria@gmail.com');

    $this->postJson('/api/v1/password-resets', ['login' => 'maria'])
        ->assertOk()
        ->assertJsonPath('data.email', 'm•••@gmail.com');

    Mail::assertSent(PasswordResetMail::class, fn (PasswordResetMail $mail) => $mail->hasTo('maria@gmail.com'));
    $token = sentTokens()['maria'];
    $reset = PasswordReset::query()->sole();
    expect($reset->user_id)->toBe($maria->id)
        // Only the hash is stored.
        ->and($reset->token_hash)->toBe(hash('sha256', $token))
        ->and($reset->token_hash)->not->toBe($token);

    $log = AuditLog::query()->where('action', 'login.password_reset_requested')->sole();
    expect($log->user_id)->toBeNull()
        ->and($log->subject_id)->toBe($maria->id)
        ->and($log->after)->toBe(['email' => 'm•••@gmail.com'])
        ->and(json_encode($log->getAttributes()))->not->toContain($token);
});

it('finds the account by email, whatever its capitals', function () {
    userWithPlayerEmail('maria', 'maria@gmail.com');

    $this->postJson('/api/v1/password-resets', ['login' => 'Maria@GMAIL.com'])->assertOk();

    expect(array_keys(sentTokens()))->toBe(['maria']);
});

it('sends one message with a link for each account that shares the email', function () {
    $ana = userWithPlayerEmail('ana', 'casa@gmail.com');
    $tito = userWithPlayerEmail('tito', 'casa@gmail.com');

    $this->postJson('/api/v1/password-resets', ['login' => 'casa@gmail.com'])->assertOk();

    $tokens = sentTokens();
    expect(array_keys($tokens))->toBe(['ana', 'tito']);

    $this->postJson("/api/v1/password-resets/{$tokens['ana']}/complete", ['password' => 'mesa-verde-7'])->assertNoContent();
    expect(Hash::check('mesa-verde-7', $ana->refresh()->password))->toBeTrue()
        ->and(Hash::check('password', $tito->refresh()->password))->toBeTrue()
        // Tito's link still works.
        ->and(PasswordReset::query()->pluck('user_id')->all())->toBe([$tito->id]);
});

it('uses the player\'s email, not the one the account was imported with', function () {
    userWithPlayerEmail('maria', 'maria@gmail.com');

    $this->postJson('/api/v1/password-resets', ['login' => 'antigo@gmail.com'])
        ->assertUnprocessable()
        ->assertJsonPath('rule', 'password_reset.unknown_account');
    Mail::assertNothingSent();
});

it('uses the account\'s own email when it has no player', function () {
    User::factory()->admin()->create(['username' => 'tesoureiro', 'email' => 'tesoureiro@gmail.com']);

    $this->postJson('/api/v1/password-resets', ['login' => 'tesoureiro'])->assertOk()->assertJsonPath('data.email', 't•••@gmail.com');
    Mail::assertSent(PasswordResetMail::class, fn (PasswordResetMail $mail) => $mail->hasTo('tesoureiro@gmail.com'));

    Mail::fake();
    PasswordReset::query()->delete();
    $this->postJson('/api/v1/password-resets', ['login' => 'tesoureiro@gmail.com'])->assertOk();
    expect(array_keys(sentTokens()))->toBe(['tesoureiro']);
});

it('says so when no account has the username or email', function () {
    $this->postJson('/api/v1/password-resets', ['login' => 'ninguem'])
        ->assertUnprocessable()
        ->assertJsonPath('rule', 'password_reset.unknown_account')
        ->assertJsonPath('errors.login.0', 'Não encontramos nenhum acesso com este usuário ou e-mail.');
    Mail::assertNothingSent();
});

it('sends nothing to the site\'s domain, an invented domain or a missing email', function (?string $email) {
    userWithPlayerEmail('joao', $email);

    $this->postJson('/api/v1/password-resets', ['login' => 'joao'])
        ->assertUnprocessable()
        ->assertJsonPath('rule', 'password_reset.no_usable_email')
        ->assertJsonPath('errors.login.0', 'Este acesso não tem um e-mail válido cadastrado. Peça a um administrador para definir uma nova senha.');

    Mail::assertNothingSent();
    expect(PasswordReset::query()->count())->toBe(0)
        ->and(AuditLog::query()->count())->toBe(0);
})->with([
    'the site\'s domain' => ['joao@ligademo.example'],
    'a subdomain of the site' => ['x@sub.ligademo.example'],
    'an invented domain' => ['nada@inventado.example'],
    'a subdomain of an invented domain' => ['x@liga.semdominio.example'],
    'no email' => [null],
]);

it('sends nothing for a disabled account', function () {
    userWithPlayerEmail('maria', 'maria@gmail.com', ['is_enabled' => false]);

    $this->postJson('/api/v1/password-resets', ['login' => 'maria'])
        ->assertUnprocessable()
        ->assertJsonPath('rule', 'password_reset.disabled');
    Mail::assertNothingSent();
});

it('refuses a second request within a minute and accepts one after it', function () {
    userWithPlayerEmail('maria', 'maria@gmail.com');
    $this->postJson('/api/v1/password-resets', ['login' => 'maria'])->assertOk();

    $this->postJson('/api/v1/password-resets', ['login' => 'maria@gmail.com'])
        ->assertUnprocessable()
        ->assertJsonPath('rule', 'password_reset.too_soon');
    Mail::assertSentCount(1);

    $this->travel(61)->seconds();
    $this->postJson('/api/v1/password-resets', ['login' => 'maria'])->assertOk();
    Mail::assertSentCount(2);
});

it('cancels the older link when a new one is asked for', function () {
    userWithPlayerEmail('maria', 'maria@gmail.com');
    $this->postJson('/api/v1/password-resets', ['login' => 'maria'])->assertOk();
    $old = sentTokens()['maria'];

    $this->travel(2)->minutes();
    Mail::fake();
    $this->postJson('/api/v1/password-resets', ['login' => 'maria'])->assertOk();
    $new = sentTokens()['maria'];

    $this->getJson("/api/v1/password-resets/{$old}")->assertUnprocessable()->assertJsonPath('rule', 'password_reset.invalid_link');
    $this->getJson("/api/v1/password-resets/{$new}")->assertOk();
});

it('keeps no link and no log entry when the mail server fails', function () {
    Mail::swap(new MailManager(app())); // a real mailer, in place of the fake
    Mail::extend('failing', fn () => new class extends AbstractTransport
    {
        protected function doSend(SentMessage $message): void
        {
            throw new TransportException('Connection refused');
        }

        public function __toString(): string
        {
            return 'failing://';
        }
    });
    config(['mail.default' => 'failing', 'mail.mailers.failing' => ['transport' => 'failing']]);
    userWithPlayerEmail('maria', 'maria@gmail.com');

    $this->postJson('/api/v1/password-resets', ['login' => 'maria'])
        ->assertUnprocessable()
        ->assertJsonPath('rule', 'password_reset.mail_failed')
        ->assertJsonPath('errors.login.0', 'Não foi possível enviar o e-mail agora. Tente de novo em alguns minutos.');

    expect(PasswordReset::query()->count())->toBe(0)
        ->and(AuditLog::query()->count())->toBe(0);
});

it('shows the account behind a link', function () {
    userWithPlayerEmail('maria', 'maria@gmail.com');
    $this->postJson('/api/v1/password-resets', ['login' => 'maria'])->assertOk();

    $this->getJson('/api/v1/password-resets/'.sentTokens()['maria'])
        ->assertOk()
        ->assertJsonPath('data.username', 'maria')
        ->assertJsonStructure(['data' => ['username', 'expires_at']]);
});

it('sets the new password, once, and ends every other login', function () {
    $maria = userWithPlayerEmail('maria', 'maria@gmail.com');
    $maria->createToken('celular');
    $rememberToken = $maria->remember_token;
    $this->postJson('/api/v1/password-resets', ['login' => 'maria'])->assertOk();
    $token = sentTokens()['maria'];

    $this->postJson("/api/v1/password-resets/{$token}/complete", ['password' => 'mesa-verde-7'])->assertNoContent();

    $maria->refresh();
    expect(Hash::check('mesa-verde-7', $maria->password))->toBeTrue()
        ->and($maria->tokens()->count())->toBe(0)
        ->and($maria->remember_token)->not->toBe($rememberToken)
        ->and(PasswordReset::query()->count())->toBe(0);

    $this->postJson('/api/v1/tokens', ['username' => 'maria', 'password' => 'password', 'device_name' => 'x'])->assertUnprocessable();
    $this->postJson('/api/v1/tokens', ['username' => 'maria', 'password' => 'mesa-verde-7', 'device_name' => 'x'])->assertCreated();

    $log = AuditLog::query()->where('action', 'login.password_reset')->sole();
    expect($log->user_id)->toBe($maria->id)
        ->and($log->after)->toBe(['password_changed' => true])
        ->and(json_encode($log->getAttributes()))->not->toContain('mesa-verde-7')->not->toContain($token);

    // A used link.
    $this->postJson("/api/v1/password-resets/{$token}/complete", ['password' => 'outra-senha-9'])
        ->assertUnprocessable()
        ->assertJsonPath('rule', 'password_reset.invalid_link')
        ->assertJsonPath('message', 'Este link não é válido ou já foi usado. Peça um novo link.');
    $this->getJson("/api/v1/password-resets/{$token}")->assertUnprocessable()->assertJsonPath('rule', 'password_reset.invalid_link');
});

it('ends the account\'s website sessions when they are kept in the database', function () {
    config(['session.driver' => 'database']);
    $maria = userWithPlayerEmail('maria', 'maria@gmail.com');
    $other = User::factory()->create();
    foreach ([$maria, $other] as $user) {
        DB::table('sessions')->insert(['id' => "session-{$user->id}", 'user_id' => $user->id, 'payload' => '', 'last_activity' => time()]);
    }
    PasswordReset::create(['user_id' => $maria->id, 'token_hash' => hash('sha256', 'abc'), 'expires_at' => now()->addHour(), 'created_at' => now()]);

    app(ResetPassword::class)('abc', 'mesa-verde-7');

    expect(DB::table('sessions')->pluck('user_id')->all())->toBe([$other->id]);
});

it('works for an account that still has only its imported password', function () {
    $player = Player::factory()->create(['email' => 'velho@gmail.com']);
    $user = User::factory()->legacy('senha-antiga')->create(['username' => 'velho', 'player_id' => $player->id]);
    $this->postJson('/api/v1/password-resets', ['login' => 'velho'])->assertOk();

    $this->postJson('/api/v1/password-resets/'.sentTokens()['velho'].'/complete', ['password' => 'mesa-verde-7'])->assertNoContent();

    $user->refresh();
    expect($user->legacy_password)->toBeNull()
        ->and(Hash::check('mesa-verde-7', $user->password))->toBeTrue();
    $this->postJson('/api/v1/tokens', ['username' => 'velho', 'password' => 'senha-antiga', 'device_name' => 'x'])->assertUnprocessable();
});

it('accepts a link for 60 minutes', function () {
    userWithPlayerEmail('maria', 'maria@gmail.com');
    $this->postJson('/api/v1/password-resets', ['login' => 'maria'])->assertOk();
    $token = sentTokens()['maria'];

    $this->travel(59)->minutes();
    $this->getJson("/api/v1/password-resets/{$token}")->assertOk();

    $this->travel(2)->minutes();
    $this->getJson("/api/v1/password-resets/{$token}")
        ->assertUnprocessable()
        ->assertJsonPath('rule', 'password_reset.expired')
        ->assertJsonPath('message', 'Este link expirou. Peça um novo link.');
    $this->postJson("/api/v1/password-resets/{$token}/complete", ['password' => 'mesa-verde-7'])
        ->assertUnprocessable()
        ->assertJsonPath('rule', 'password_reset.expired');
});

it('refuses a link that never existed and a link of a disabled account', function () {
    $this->getJson('/api/v1/password-resets/nao-existe')->assertUnprocessable()->assertJsonPath('rule', 'password_reset.invalid_link');

    $maria = userWithPlayerEmail('maria', 'maria@gmail.com');
    $this->postJson('/api/v1/password-resets', ['login' => 'maria'])->assertOk();
    $maria->update(['is_enabled' => false]);

    $this->postJson('/api/v1/password-resets/'.sentTokens()['maria'].'/complete', ['password' => 'mesa-verde-7'])
        ->assertUnprocessable()
        ->assertJsonPath('rule', 'password_reset.invalid_link');
});

it('refuses a new password shorter than 8 characters and keeps the link', function () {
    userWithPlayerEmail('maria', 'maria@gmail.com');
    $this->postJson('/api/v1/password-resets', ['login' => 'maria'])->assertOk();
    $token = sentTokens()['maria'];

    $this->postJson("/api/v1/password-resets/{$token}/complete", ['password' => 'curta'])
        ->assertUnprocessable()
        ->assertJsonPath('errors.password.0', 'O campo senha deve ter pelo menos 8 caracteres.');
    $this->getJson("/api/v1/password-resets/{$token}")->assertOk();
});

it('asks for the username or email', function () {
    $this->postJson('/api/v1/password-resets', [])
        ->assertUnprocessable()
        ->assertJsonPath('errors.login.0', 'O campo usuário ou e-mail é obrigatório.');
});

it('writes the message in Brazilian Portuguese with a link to the app', function () {
    config(['app.url' => 'https://www.ligademo.example/']);
    userWithPlayerEmail('maria', 'maria@gmail.com');
    $this->postJson('/api/v1/password-resets', ['login' => 'maria'])->assertOk();
    $token = sentTokens()['maria'];
    $url = "https://www.ligademo.example/app/reset-password?token={$token}";

    Mail::assertSent(PasswordResetMail::class, function (PasswordResetMail $mail) use ($url) {
        $mail->assertHasSubject('Liga Demo: redefinir a senha')
            ->assertSeeInHtml($url)
            ->assertSeeInText($url)
            ->assertSeeInOrderInText(['redefinir a senha do usuário maria', 'vale por 60 minutos']);

        return true;
    });
});

it('names each account in the message for a shared email', function () {
    $mail = new PasswordResetMail([
        ['username' => 'ana', 'url' => 'https://example.org/app/reset-password?token=a'],
        ['username' => 'tito', 'url' => 'https://example.org/app/reset-password?token=b'],
    ], 60);

    $mail->assertSeeInOrderInText(['mais de um acesso', 'ana:', 'token=a', 'tito:', 'token=b'])
        ->assertSeeInOrderInHtml(['ana', 'token=a', 'tito', 'token=b']);
});
