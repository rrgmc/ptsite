# Accounts and roles

Status: Agreed. The technical decision is [0008](../decisions/0008-accounts-and-roles.md).

## Goal

One login for everyone. Admin work happens where it is needed, often on a phone at the table, without a
separate back office.

## Who

Everyone who uses the site.

## Rules

1. **Everyone logs in the same way**, with one account. There are no separate admin accounts.
2. An account can be **linked to a player**. An admin who doesn't play has an account with no player.
3. Nobody can sign up alone. An admin creates each account.
4. A login stays valid for **30 days** when "remember me" is chosen.
5. Each account has one **role**:

   | Role | Can do |
   |---|---|
   | **Player** | Everything members do: see standings, results and players; edit their own profile; while active, fill the partial result of the open night |
   | **Results keeper** | Everything a player does, plus: open and close nights, enter and correct results, quick-add players |
   | **Admin** | Everything: seasons, percentage tables, places, players, accounts and roles, plus everything a results keeper does |

6. **Admin actions appear in context.** On a night's page, a results keeper or admin also sees "Abrir" (open),
   "Finalizar" (finish), "Editar resultados" (edit results) and "Editar evento" (edit the place and description;
   on an open or finished night, admins only). On an open night an admin also sees "Desfazer abertura" (undo the
   opening). Players don't see them.
7. **"Administração"** is a section of the same site for managing lists (seasons, players, places, accounts).
   Only admins see it in the menu. Its tab **"Configurações"** shows which features the site has and the site's
   version. It changes nothing: a site's features are set when the site is built. A **place can be archived**: it is no longer offered when a night or a season
   picks its place, and the nights already at it keep it. Archiving asks for confirmation first. The archived
   place stays in the admin list, marked "arquivado", and can be restored there.
8. **Every change made by a results keeper or admin is recorded**: who, when, what, and the values before and
   after. For example: "results of Liga - 14/03/2026 changed by X on 15/03/2026: 2nd place Y → Z". The partial
   result of an open night is the exception: its saves are not recorded, whoever makes them, because finishing
   the night replaces it and is recorded (see [seasons-and-nights.md](seasons-and-nights.md)).
9. **Site access is managed on the player's page.** In "Administração" > "Jogadores" > "Editar", an admin gives a
   player a login (username and password) and a role, and later changes the role or sets a new password. On
   screen the roles are **Jogador**, **Responsável** and **Administrador**.
   - A new login starts as Jogador unless another role is chosen.
   - Usernames are unique, ignoring capitals.
   - A new password replaces an old password, including an old hash from imported data.
   - The audit log records the change, never the password.
10. **Nobody changes their own role.** So an admin can't lock themself out, and there is always an admin: whoever
    demotes an admin is an admin too.
11. **Everyone changes their own password** in "Meu perfil".
    - The current password must be typed, so that someone who finds the site open on another person's phone
      cannot take the account.
    - The new password is typed twice and has at least 8 characters, like a password set by an admin.
    - The user stays logged in. Other apps that use the account must log in again.
    - The audit log records that the password changed, never the password.
    - An account with no player has "Meu perfil" too, with only the password.
12. **A user who forgot the password asks for a link by email** ("Esqueci minha senha", on the login screen).
    - The user types the **username or the email**. The site sends a link to the account's email: the player's
      email for an account linked to a player, the account's own email otherwise.
    - The link opens a screen to type a new password twice, with at least 8 characters. It works for **60
      minutes** and **once**. Asking for a new link cancels the older one.
    - Several accounts can share one email. Then one message lists a link for each username.
    - **Some addresses never get a link**: an address on the site's own domain (set by the site, for
      example `ligademo.example` and its subdomains) and an address on the list of placeholder domains
      (`email.com` and `email.com.br`, plus the ones the site adds). Admins sometimes type such addresses for
      players who gave no email. The site then says so and tells the user to ask an admin, who sets a new password
      (rule 9).
    - The site says what went wrong: no account found, no valid email, or a disabled account. After a link is
      sent, it shows the address with most of the name hidden, for example `m•••@example.com`.
    - A second request within one minute is refused.
    - After the new password is saved, the user logs in with it. Every other login of the account, on any
      device or app, ends.
    - The audit log records the request and the new password, never the link or the password.

## Examples

Names are invented.

- **The host enters results.** Maria is a player with the results keeper role. After the game, Maria opens the
  night's page on a phone, taps "Finalizar", enters the pot and the finishing order, and saves. The audit
  log records it.
- **A player can't.** Guga is a player. The "Finalizar" button doesn't appear for Guga, and a request made
  directly to the API would be refused.
- **A new host.** Maria has played for years with her own login. The admin opens Maria in "Jogadores", picks
  "Responsável" and saves. From her next page, Maria sees "Abrir" and "Finalizar" on nights.
- **Access for a first-timer.** "Kiko" was quick-added last week and has no login. The admin opens Kiko,
  types the username "kiko" and a password, and taps "Criar acesso". Kiko logs in with them and sees the
  standings.
- **No self-demotion.** An admin opens their own player and picks "Jogador". The site refuses: "Você não pode
  mudar o seu próprio papel."
- **A new password.** Maria opens "Meu perfil", types her current password and "mesa-verde-7" twice, and taps
  "Alterar senha". From then on she logs in with "mesa-verde-7"; the old password is refused.
- **Wrong current password.** Guga types a wrong current password. The site answers "A senha atual está
  incorreta." and the password stays as it was.
- **Forgotten password.** Maria's email is `maria@example.com`. On the login screen she taps "Esqueci minha
  senha", types "maria" and sends. The site answers "Enviamos um link para m•••@example.com." She opens the link,
  types "mesa-verde-7" twice and saves. She then logs in with "mesa-verde-7".
- **By email, with capitals.** Maria types "Maria@EXAMPLE.com" instead of her username. She gets the same link.
- **A shared email.** Ana and Tito share `casa@example.com`. Ana types that address. One message arrives with two
  links, one for "ana" and one for "tito". Ana's link changes only Ana's password.
- **An address on the site's domain.** Guga's email is `guga@ligademo.example`, typed by an admin. The site
  sends nothing and answers "Este acesso não tem um e-mail válido cadastrado. Peça a um administrador para
  definir uma nova senha." The same happens for `x@sub.ligademo.example`, for the placeholder
  `nada@inventado.example` and `x@liga.semdominio.example`, and for an account with no email.
- **Unknown user.** Someone types "ninguem". The site answers "Não encontramos nenhum acesso com este usuário
  ou e-mail."
- **An old link.** Maria opens her link 59 minutes after asking: it works. After 61 minutes the site answers
  "Este link expirou. Peça um novo link."
- **A used link.** Maria opens the link again after saving the new password. The site answers "Este link não é
  válido ou já foi usado. Peça um novo link."
- **Correction.** An admin corrects 2nd and 3rd place a day later. The standings change at once, and the audit
  log shows both the old and new order.

## Data imported from an older site

- A site that moves from an older site keeps its own importer. The core only supports it: tables have a
  `legacy_id` column, and an imported account may carry an old MD5 hash.
- An old hash is checked once at the next login and replaced with a modern hash. It is never the long-term login
  method.
- Imported emails may be placeholders. An account with one cannot get a password link (rule 12) until the
  player saves a real address in "Meu perfil".

## Open questions

- Can a player see the audit log (for example "results changed" on a night's page), or only admins?
- Where are logins **without a player** managed (an admin who doesn't play)? The player's page can't reach
  them. An import may create none.
