# 3. API first, with a complete API that includes admin

- Status: Proposed
- Date: 2026-09-24

## Context

The site and the admin area must be mobile first. A phone app may come soon, so the backend must offer a
complete API. If the website and the API were built separately, the API could quietly fall behind the website.

## Decision

- The backend is **API only**, under `/api/v1`. The website is a single-page app that uses nothing but this
  API (see [0004](0004-react-spa.md)). If the website can do something, the API can do it too.
- The API covers **everything**, including admin features (seasons, nights, results, players, places).
- Permissions are enforced **in the API**, by Laravel policies. The website hiding a button is cosmetic only.
- Authentication uses **Sanctum**: cookie sessions for the website on the same domain, tokens for other clients.
  Logins can stay valid for 30 days.
- The **OpenAPI spec** is generated from the code, and the website's API client is generated from the spec.
- API conventions (errors, validation errors, pagination, dates, money, naming, versioning, `updated_since`)
  are fixed in [api.md](../architecture/api.md).

## Consequences

- The phone app choice stays open: a PWA, React Native, Flutter or a native app can all use the same API.
- The repository contains two languages, PHP and TypeScript, and the website needs a JavaScript build step.
- Every feature needs an endpoint before it can have a screen. That is the price of a complete API.

## Alternatives considered

- **A server-rendered site (Blade or Livewire) plus a parallel API.** Simpler and closer to plain Laravel
  tutorials. Rejected because nothing would force every feature to exist in both, so the API would likely fall
  behind. Keeping it complete would need an extra rule and tests.
