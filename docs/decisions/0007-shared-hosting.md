# 7. Shared hosting, built in CI

- Status: Proposed
- Date: 2026-09-24

## Context

The target is cheap shared cPanel hosting, which many small leagues use. Shared hosts often lack SSH, Composer, Node.js and long-running processes.

## Decision

- Target shared hosting with **PHP 8.3 or newer** and MySQL (with `utf8mb4`).
- **Build in CI** (or locally): `composer install --no-dev`, the frontend build, and the OpenAPI spec. Upload
  the result, including `vendor/`.
- Serve the SPA's static files and the API from the **same domain**, with the domain pointing at Laravel's
  `public/` folder.
- Avoid features that need long-running processes, such as queue workers and websockets. Scheduled tasks use
  the host's cron, if needed.

Details are in [deployment.md](../architecture/deployment.md).

## Consequences

- No queues or real-time updates without extra work. For a site of this size, that is acceptable.
- A test deploy to a folder on the shared host proves that this assumption holds.

## Alternatives considered

- **A VPS or managed Laravel hosting** (Forge, Ploi). More control and fewer limits, at more cost and
  maintenance. It remains an option if shared hosting proves too limiting.
