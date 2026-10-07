# 2. Business logic in plain classes, changes through action classes

- Status: Proposed
- Date: 2026-09-24

## Context

The main developer has worked a lot with Yii, which uses Active Record, and found that the code gets messy:
rules end up in models, controllers, save hooks and views. The site is small, though, and non-engineers will
add features with Claude. The structure must be organized without making every change long and hard to review.

## Decision

Use a **middle ground** between plain Laravel and strict ports-and-adapters:

1. **Rules and calculations are plain PHP classes** in `src/Domain` (namespace `PTSite\Domain`). They do not use
   any `Illuminate` class. Examples: points calculation, percentage table, standings, statistics, ranking
   simulator, game-night rules.
2. **Every change goes through an action class** (`FinishNight`, `OpenNight`, `SavePlayer`, …) in
   `app/Actions`. An action checks permissions and rules, calls the domain classes, and may use Eloquent models
   to load and save.
3. **Models, controllers and requests stay thin.** Models hold columns, relationships and casts only.
   Controllers call one action or one query and return a resource. No save hooks with side effects.
4. **The rules are enforced**, not hoped for: Pest architecture tests fail the build when framework code
   enters `src/Domain`, when controllers save models, and so on. `AGENTS.md` describes the pattern so coding
   assistants (Claude, Gemini, …) follow it for every contributor.

Details and examples are in [backend-layers.md](../architecture/backend-layers.md).

## Consequences

- The rules can be unit-tested without a database, using the examples in `docs/specs/`.
- A simple feature such as "add a phone number to players" still touches only a few files: migration, model,
  request, resource, action and frontend. Non-engineers can review that.
- Action classes depend on Eloquent. If one area grows complex, it can move to strict repositories on its own,
  without touching the rest, because all changes already go through actions.

## Alternatives considered

- **Strict separation (ports and adapters).** Action classes use repository interfaces and plain domain
  objects, with Laravel classes converting between them and the database. Rejected for now: it roughly doubles
  the code per record type, and a missed field in the conversion code is a mistake non-engineers cannot easily
  spot in review. It pays off in large, long-lived codebases maintained by engineers.
- **Plain Laravel (rules in models and controllers).** Rejected: this is the Yii mess the structure is meant
  to prevent.
