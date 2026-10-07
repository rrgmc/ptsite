# 10. Docs layout and specs process

- Status: Proposed
- Date: 2026-09-24

## Context

Two people contribute. The main developer is a software engineer. The other is a professional designer who
knows the league's rules very well and acts as product manager (PM). Both work with Claude. Decisions,
rules and the current design each need a clear home, so nobody has to re-argue settled questions.

## Decision

Organize `docs/` into three folders:

| Folder | What goes there | Changes? |
|---|---|---|
| `docs/decisions/` | Architecture decision records (ADRs), one per decision | Only the status changes |
| `docs/architecture/` | How the system is built *now* | Kept up to date |
| `docs/specs/` | Plain-language rules of the site, owned by the designer/PM | Kept up to date |

The process:

- **New features start as GitHub issues** from a simple template: goal, who uses it, rules, screens. The
  designer can write them or ask Claude to draft them.
- **Lasting rules live in `docs/specs/`**, written in plain language with worked examples.
- **The examples in specs are mirrored as tests** of the domain classes, and the test names read like the spec.
- **`AGENTS.md` holds a glossary** (Brazilian Portuguese screen terms ↔ English code terms), so anyone can ask Claude for
  features using the site's own words.

## Consequences

- The designer can check that the code follows the rules by reading specs and test names, without reading
  the code.
- Whoever changes a rule, or their coding assistant, must keep specs, tests and code in sync. `AGENTS.md`
  says so. It is shared by all assistants: `CLAUDE.md` and `GEMINI.md` only import it.

## Alternatives considered

- **Docs only (no issues).** Harder to discuss and track work in progress.
- **Issues only (no docs).** Rules get scattered across closed issues and are hard to find later.
