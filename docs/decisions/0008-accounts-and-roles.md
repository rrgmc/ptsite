# 8. One login, three roles, admin in the same app

- Status: Proposed
- Date: 2026-09-24

## Context

An older site may keep separate accounts and a separate area for administrators, with groups and many
fine-grained operations. Admins are usually also players, so they would need two logins. Here, admin work
mostly happens on a phone at the poker table, such as entering a night's results.

## Decision

- **One `users` table and one login.** A user may be linked to a player. An admin who does not play is a user
  with no player link.
- **Three roles:**
  - **Player**: uses the site as a member.
  - **Results keeper**: can also open and close nights and enter results, for example the host of the night.
  - **Admin**: can do everything.
- Permissions are checked by Laravel **policies** in the API. Finer roles can be added later.
- **Admin lives in the same app**, with the same design system:
  - **Actions in context.** On a night's page, a user with the right role also sees "Abrir", "Finalizar" and
    "Editar resultados".
  - **An "Administração" section** for managing lists: seasons, players, places and percentage tables. Only
    users with the right role see it.
  - Admin screens load in a separate bundle. That is for speed; security comes from the API.

The rules are written in plain language in [accounts-and-roles.md](../specs/accounts-and-roles.md).

## Consequences

- Admins log in once and never switch apps.
- Importing accounts from an older site means mapping its admin accounts to players where they match. That is
  the job of the importer in the site repository.

## Alternatives considered

- **A separate admin login and app.** Its main benefit is security isolation, which matters little
  for this site, and the API checks permissions on every request anyway.
- **One login with a visually separate back office.** Rejected because a desktop-style back office suits admins
  who work at a desk, and here they mostly won't.
- **Fine-grained groups and permissions.** Rejected as unused complexity. Policies make it cheap to
  add later.
