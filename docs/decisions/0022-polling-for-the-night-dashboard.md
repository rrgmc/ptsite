# 22. The night dashboard refreshes by asking again every 10 seconds

- Status: Proposed
- Date: 2026-10-08

## Context

The night dashboard ([night-dashboard.md](../specs/night-dashboard.md)) is used by several people at the same
table, each on a phone. One marks a payment and the others must see it soon, without reloading.

The site runs on shared hosting, which has no long-running processes
([0007](0007-shared-hosting.md)): no websockets, no server-sent events, no queue worker. Until now no screen
refreshed by itself; a screen was read again when its window got the focus back.

## Decision

- **The dashboard asks the API for the whole dashboard again every 10 seconds** (polling), with one request:
  `GET /nights/{id}/dashboard`.
- **It asks only while it is on screen.** A phone that is locked, or showing another app, asks nothing.
- **It asks only while the night is open.** A finished night changes only when an admin corrects it.
- **It does not ask while a change of its own is on its way.** Every change answers the whole dashboard, which
  is newer than a refresh.
- **Only the dashboard does this.** Every other screen keeps reading again on focus.
- **Each change is small and names what it changes**: one mark, one rebuy, one position. Two phones changing
  different things do not undo each other, whatever each one had on screen. A rebuy is added with the number
  of rebuys the person saw, so the same rebuy recorded on two phones is added once.
- **Changes to one night run one after the other**, under a lock on the night's row.

## Consequences

- A change made on one phone shows on the others within about 10 seconds, not at once.
- Ten phones on a night make one request a second. Each one reads a handful of rows; a night has some dozens
  of players at most.
- Every request writes the session row, as any request does. If a host struggles, the interval is one constant
  (`DASHBOARD_REFRESH_MS` in `frontend/src/api/queries.ts`).
- Nothing new runs on the server, so the site still deploys as files to shared hosting.

## Alternatives

- **Websockets or server-sent events.** They show a change at once, but need a process that stays running,
  which 0007 rules out.
- **Asking only for what changed since the last answer.** Fewer bytes, but more code on both ends for a
  payload of a few kilobytes.
- **Saving the whole dashboard on each tap**, as the partial result's form does. The last save would undo what
  other phones changed in the seconds between a refresh and a tap.
