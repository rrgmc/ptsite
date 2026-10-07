# 1. Laravel as the backend framework

- Status: Proposed
- Date: 2026-09-24

## Context

PTSite is a base for poker league sites. A league may bring data from a site it had before, whatever that ran
on. The backend must:

- run on shared PHP hosting (see [0007](0007-shared-hosting.md));
- serve a complete JSON API for a single-page website and a possible phone app (see [0003](0003-api-first.md));
- keep business logic out of the MVC code (see [0002](0002-business-logic-layering.md));
- be learnable by a team that knows neither Laravel nor Symfony, and by non-engineers working with Claude.

## Decision

Use **Laravel** (current release, PHP 8.3 or newer) as an API-only backend:

- **Sanctum** for authentication: cookie sessions for the website on the same domain, tokens for a future app.
- **Form Requests** for input validation, **policies** for permissions, **API Resources** for the JSON shape.
- **Scramble** to generate the OpenAPI spec from the code.
- **Pest** for tests, including architecture tests.

## Consequences

- Laravel's full-stack features (Blade, Livewire, Filament, starter kits) go unused. Laravel is chosen for its
  API support, its login support for a same-domain SPA and how easy it is to learn.
- Laravel does not enforce consistent API conventions by itself. They are fixed in
  [api.md](../architecture/api.md) and checked by tests.
- Eloquent is Active Record. Rules are kept out of the models by [0002](0002-business-logic-layering.md).

## Alternatives considered

- **Symfony + API Platform.** The strongest alternative. It is built for API-first work: OpenAPI, pagination,
  filters and JSON-LD come out of the box, and Doctrine's plain objects suit clean separation. It lost because
  our API is mostly *actions with rules* (open a night, finish a night, quick add), not CRUD over resources.
  Each of those would become a custom operation, working against API Platform's automatic style. It also has
  a steeper learning curve.
- **Laravel + Filament admin.** Considered first, when the site was going to be server-rendered. Dropped when
  the admin area was chosen to be hand-built and then API first.
- **CodeIgniter 4 / CakePHP 5.** Lighter and fine on shared hosting, but smaller ecosystems.
- **Slim, Mezzio or other micro-frameworks.** Login, validation, the database layer and migrations would have
  to be assembled by hand. That repeats a hand-rolled approach.
- **Leaving PHP.** API first would allow any backend language, but shared hosting pins it to PHP.
