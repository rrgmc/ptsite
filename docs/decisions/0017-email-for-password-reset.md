# 17. Email for the password reset, through the host's mailbox

- Status: Proposed
- Date: 2026-10-04

## Context

Users forget passwords, and until now only an admin could set a new one. A "forgot my password" feature needs
the site to send email, which it never did. Four facts limit the choice:

- The host is shared, with no queue worker and no cron job ([0007](0007-shared-hosting.md)).
- The site's domain normally has an SPF record that covers the host's mail relay and a DKIM key. A DMARC record
  may be missing.
- Emails are not unique: an address may be used by more than one account, which happens in data imported from an
  older site. Laravel's password broker stores one link per email, so it cannot serve two accounts with the same
  address.
- Many emails are typed by admins, not by the players, and some are placeholders for a player who gave none.
  Some placeholder domains exist and belong to strangers.

## Decision

- **Send through a mailbox on the site's domain** (`MAIL_MAILER=smtp`, with the host's authenticated SMTP server). The
  mailbox name and password are in the server's `.env` only.
- **Send inside the request**, never through a queue. The SMTP timeout is 15 seconds.
- **Keep our own table of links**, `password_resets`, with one row per account. It holds the SHA-256 hash of a
  random 64-character token, never the token. A link works for 60 minutes and once. The stock
  `password_reset_tokens` table is dropped.
- **Refuse some addresses**: the site's own domain (`PASSWORD_RESET_SITE_DOMAIN`), its subdomains, and a list of
  placeholder domains in `config/password_reset.php`. The built-in list holds only `email.com` and
  `email.com.br`. A site adds more with `PASSWORD_RESET_BLOCKED_DOMAINS`. The rule is in
  `PTSite\Domain\Accounts\PasswordResetRules`.
- **Say what went wrong.** The site tells the user that no account was found or that the account has no valid
  email, and shows the address with most of the name hidden after sending.
- **Build the link from `APP_URL`**, not from the request's host name.
- **Mailpit catches the mail in development.** It runs in Docker beside MySQL. The tests use Laravel's `array`
  mailer and need no mail server.

## Consequences

- No new service, account or package. The messages pass SPF and DKIM. A DMARC record should be added.
- Delivery depends on the reputation of the shared server, so a message can land in spam. The screen tells the
  user to look there.
- A request waits for the SMTP server. If the server fails, the user sees an error and no link is kept.
- Anyone can find out whether a username exists, and can see the first letter and the domain of its email. The
  league is small and private, and clear messages were preferred. A limit on requests per minute slows guessing.
- Accounts with a placeholder address cannot use the feature. They still need an admin until the player saves a
  real address in "Meu perfil".
- "Meu perfil" changes the email without asking for the password. A person who finds the site open on another
  person's phone can change the email and then ask for a link. Rule 11 of the accounts spec does not cover this
  path. It is not fixed here.
- An account with no player has no screen to change its email.
- A placeholder domain missing from the list would get a link. A site adds its own with
  `PASSWORD_RESET_BLOCKED_DOMAINS`.

## Alternatives considered

- **A transactional mail service** (Resend, Brevo). Better delivery, but a new account, new DNS records, a
  package and a key on the server, for a few messages a month. It stays open if delivery proves poor.
- **PHP `sendmail` on the host.** No password to keep, but the least reliable way on a shared host. It is the
  fallback if the host blocks SMTP from PHP.
- **Laravel's password broker.** One link per email, so shared addresses break it.
- **Only send to addresses saved on the site.** Safest against placeholder domains, but every imported real
  address would also need an admin first.
- **One neutral message for every case.** Hides which accounts exist, but a player with a placeholder address
  would wait for a message that never comes.
