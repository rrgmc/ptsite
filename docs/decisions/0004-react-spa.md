# 4. React + TypeScript single-page app, mobile first, PWA

- Status: Proposed
- Date: 2026-09-24

## Context

With an API-first backend ([0003](0003-api-first.md)), the website is a separate client. It must be mobile
first for both players and admins. The phone app type is undecided, so the website should not close off any
path.

## Decision

- **React + TypeScript**, built with **Vite** into static files served by Laravel from the same domain, so
  login cookies just work.
- **React Router** for routing, with the admin screens in a separately loaded bundle.
- **TanStack Query** for loading and caching API data.
- **React Hook Form + Zod** for forms. The API still has the final say on every rule.
- An **API client and types generated from the OpenAPI spec**. When an API field changes, the website fails to
  build instead of breaking quietly.
- **Mobile first**: designed for phone width first and widened for desktop.
- A **PWA** manifest and service worker from the start, so players can install the site on their home screen.

Details are in [frontend.md](../architecture/frontend.md).

## Consequences

- If the phone app becomes React Native (Expo), people's skills and some code (API client, types, validation)
  carry over.
- Contributors need Node.js for the frontend build.

## Alternatives considered

- **Vue + TypeScript.** Gentler to learn, with HTML-like templates. Rejected because its path to a native phone
  app is weaker.
- **Livewire or Blade.** Server-rendered, which would not be API first (see [0003](0003-api-first.md)).
- **Inertia.** It joins Laravel and React without a public API, which does not meet the complete-API
  requirement.
