# 6. One repository with backend/ and frontend/

- Status: Proposed
- Date: 2026-09-24

## Context

The backend (Laravel) and the website (React) are separate projects that change together. A phone app may
join later.

## Decision

Keep everything in this repository:

```
backend/    Laravel API
frontend/   React SPA and Storybook
docs/       decisions, architecture, specs
deploy/     scripts that build the package and upload it to a shared host
```

Both are built and deployed together. A league's site repository pins this repository as a git submodule. A future phone app can be added as another top-level folder.

## Consequences

- One pull request can change the API, the generated client and the screens at once, and CI checks them
  together.
- Each folder has its own dependencies and tooling (Composer, npm).

## Alternatives considered

- **Frontend inside Laravel** (`resources/`, built by Laravel's Vite setup). Fewer folders, but it ties the
  website's tooling to Laravel's and makes the frontend look like part of the backend.
- **Separate repositories.** Independent versions and deploys. Rejected because it adds coordination for a
  small team without real benefit.
