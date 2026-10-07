<?php

namespace PTSite\App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/**
 * The message with the password link (docs/specs/accounts-and-roles.md, rule 12). It lists one link for each
 * account that uses the address. It is sent inside the request: the host has no queue worker.
 */
final class PasswordResetMail extends Mailable
{
    /** @param  list<array{username: string, url: string}>  $links */
    public function __construct(public readonly array $links, public readonly int $expireMinutes) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: config('app.name').': redefinir a senha');
    }

    public function content(): Content
    {
        $site = config('app.name');
        $tagline = trim((string) config('ptsite.tagline'));

        return new Content(view: 'ptsite::mail.password-reset', text: 'ptsite::mail.password-reset-text', with: [
            'site' => $site,
            'signature' => $tagline === '' ? $site : "{$site} - {$tagline}",
        ]);
    }
}
