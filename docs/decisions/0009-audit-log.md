# 9. Audit log of admin changes

- Status: Proposed
- Date: 2026-09-24

## Context

Points are money: a player's points are their share of the night's pot. When results are corrected, the
league should be able to answer "who changed the results of night X, when, and from what?".

## Decision

Record every change made by an admin or results keeper in an audit log: who, when, which action, which record,
and the values before and after. The log is written by the **action classes** (see
[0002](0002-business-logic-layering.md)), since they are the single place where changes happen.

## Consequences

- Every new action class must write an audit entry. An architecture test or a base class can help enforce it.
- The log can be shown later, for example on a night's page ("results changed by … on …").

## Alternatives considered

- **Model events or a package that watches Eloquent models.** Rejected because it records row changes instead
  of meaningful actions, and relies on save hooks, which [0002](0002-business-logic-layering.md) avoids.
- **No audit log at first.** Rejected: it is cheap to add while the action classes are being written.
