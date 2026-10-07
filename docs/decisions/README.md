# Decisions

This folder holds the architecture decision records (ADRs) for PTSite. Each record explains one decision:
why it had to be made, what was chosen, what follows from it and which options were rejected.

## Rules

- Each record is one file, named `NNNN-short-title.md` and numbered in order.
- A record has these sections: Status, Date, Context, Decision, Consequences, Alternatives considered.
- Status is one of **Proposed**, **Accepted**, **Rejected** or **Superseded by NNNN**.
- Once accepted, a record is never edited except for its status. A changed decision gets a new record that
  supersedes the old one.
- All current records are **Proposed**. They describe the stack and way of working, which are not yet proven.
  Each one is accepted or superseded once the core has been used by a league.
- The numbers 0011, 0012, 0014 and 0019 are not used here: those records were specific to one site.

## Template

```markdown
# N. Title

- Status: Proposed
- Date: YYYY-MM-DD

## Context
What problem or requirement forced a choice.

## Decision
What we chose.

## Consequences
What this makes easier, what it makes harder, what we must now do.

## Alternatives considered
Each option with the reason it lost.
```

## Index

| # | Decision | Status |
|---|---|---|
| [0001](0001-laravel-backend.md) | Laravel as the backend framework | Proposed |
| [0002](0002-business-logic-layering.md) | Business logic in plain classes, changes through action classes | Proposed |
| [0003](0003-api-first.md) | API first, with a complete API that includes admin | Proposed |
| [0004](0004-react-spa.md) | React + TypeScript single-page app, mobile first, PWA | Proposed |
| [0005](0005-ui-design-system.md) | React Aria, design tokens, Storybook, WCAG 2.2 AA | Proposed |
| [0006](0006-monorepo-layout.md) | One repository with `backend/` and `frontend/` | Proposed |
| [0007](0007-shared-hosting.md) | Shared hosting, built in CI | Proposed |
| [0008](0008-accounts-and-roles.md) | One login, three roles, admin in the same app | Proposed |
| [0009](0009-audit-log.md) | Audit log of admin changes | Proposed |
| [0010](0010-docs-and-specs-process.md) | Docs layout and specs process | Proposed |
| [0013](0013-mysql-everywhere.md) | MySQL 5.7 in development, tests and CI | Proposed |
| [0015](0015-chart-library.md) | Recharts for charts, loaded only with the statistics | Proposed; its five-color limit is replaced by 0020 |
| [0016](0016-server-side-player-photos.md) | Player photos are cut and resized on the server | Proposed |
| [0017](0017-email-for-password-reset.md) | Email for the password reset, through the host's mailbox | Proposed |
| [0018](0018-releases-and-versions.md) | Releases are git tags, and the tag is the version | Proposed |
| [0020](0020-eight-chart-colors.md) | Eight chart colors, for a line chart of eight players | Proposed |
| [0021](0021-feature-flags.md) | A site turns features off in its `site.json` | Proposed |

## Not yet decided

- **Design tool.** Depends on what the designer uses (Figma, Penpot or designing in code).
- **Data migration.** The core has no importer. A site that moves from an older site keeps its own importer in
  its site repository. The `legacy_id` columns and the upgrade of old password hashes at login support it.
- **Contributor workflow.** CI exists ([ci.yml](../../.github/workflows/ci.yml)). Releases are decided
  ([0018](0018-releases-and-versions.md)). Preview builds, reviews and whether a release uploads itself to the
  site are open.
- **Specs in Brazilian Portuguese.** The language itself is settled: screens in Brazilian Portuguese (pt-BR),
  code and docs in English. Whether the specs also need a pt-BR version for the designer is open.
