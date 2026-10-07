# 21. A site turns features off in its site.json

- Status: Proposed
- Date: 2026-10-07

## Context

The core is shared by several leagues, and some of its parts are habits of one league: the Main Event pot and
the time chip of a night, and the season planner. Another league has to be able to do without them. More such
parts will come.

Both ends need the answer. The API must not ask for an amount the site does not have, and the screens must not
show it. The frontend has no settings at run time: it reads `site.json` when it is built
([frontend.md](../architecture/frontend.md), "Site settings").

## Decision

- **A site turns a feature off in `features` of its `site.json`**: `"features": { "timeChip": false }`. The
  backend reads the file at run time and the frontend when it is built, as for every other setting.
- **Every feature has a default, and the first ones are on by default.** A site that names none behaves as
  before.
- **Each end has one list of the features**: the enum `PTSite\Domain\Features\Feature` and
  `frontend/src/site/features.ts`. A test compares the two.
- **Code asks one question, "does this site have the feature?"**: `Features::enabled()` in the backend and
  `hasFeature()` in the frontend. No code reads the setting itself.
- **A feature that is off is refused by the API, not only hidden.** A route of its own answers 404
  (`RequireFeature`). A field of its own is not required and is not kept.
- **Turning a feature off deletes nothing.** What was recorded stays in the database.
- **The frontend build stops on a feature name it does not know.** The backend ignores one.

## Consequences

- A change of a feature needs a new build and a new deploy of the site, like a change of its name.
- The unit tests, Storybook and the end-to-end tests run on the demo site, which has every feature. A screen
  with a feature off is checked by a backend test that sets `ptsite.features`, and by a unit test or a story
  that calls `overrideFeatures`.
- An API client other than the website cannot ask which features a site has. It learns it from a 404, or from
  an amount that comes back `null`.
- Each new feature flag adds a second way for a screen and a rule to behave, which must be tested and kept
  working. A flag is for a part a league does without, not for a preference.

## Alternatives considered

- **A setting in `.env` or `config/ptsite.php` only.** The frontend could not read it without a new endpoint,
  and the two ends could disagree.
- **An endpoint that lists the features, read by the frontend at run time.** The screens would have to wait for
  it before drawing a form, and the build could not check the names.
- **A table in the database, changed by an admin.** These are choices made once, when the site is set up, by
  whoever sets it up. A screen for them is not worth its cost yet.
