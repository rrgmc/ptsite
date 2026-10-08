# Specs

This folder holds the rules of the PTSite core, written in plain language for anyone who knows the league. The
designer, acting as product manager, owns these documents. The reasons for this process are in
[0010](../decisions/0010-docs-and-specs-process.md).

## How specs work

- **A feature starts as a GitHub issue**: goal, who uses it, rules, screens. It can be rough.
- **When a rule is agreed, it goes into a spec here.** Specs describe what the site does, not how it is built.
- **Every rule has a worked example.** Developers, or Claude, turn each example into a test of the domain
  classes, with a test name that reads like the rule. To check that the code follows a spec, read the test
  names; you don't need to read the code.
- **Specs change when the rules change.** The change goes in the same pull request as the code and the tests.
- Screen labels are quoted in Brazilian Portuguese, as they will appear on the site. The glossary in `AGENTS.md` maps
  them to the English terms used in code.
- Anything not decided yet is listed under **Open questions** at the end of the spec.

## Status of each spec

| Spec | Status |
|---|---|
| [players.md](players.md) | Agreed |
| [accounts-and-roles.md](accounts-and-roles.md) | Agreed |
| [seasons-and-nights.md](seasons-and-nights.md) | **Draft** for designer review |
| [points-and-standings.md](points-and-standings.md) | **Draft** for designer review |
| [attendance.md](attendance.md) | Agreed |
| [season-planner.md](season-planner.md) | Agreed |
| [season-calendar.md](season-calendar.md) | Agreed |
| [statistics.md](statistics.md) | **Draft** for designer review |
| [main-event.md](main-event.md) | **Draft** for designer review |

## Template

```markdown
# Feature name

Status: Draft | Agreed

## Goal
Why the league needs this.

## Who
Which roles use it (player, results keeper, admin).

## Rules
Numbered, one rule per item, in plain language.

## Examples
Worked examples with real-looking numbers. Each one becomes a test.

## Screens
What the user sees and does, phone first. Links to designs.

## Open questions
```
