# 5. React Aria, design tokens, Storybook, WCAG 2.2 AA

- Status: Proposed
- Date: 2026-09-24

## Context

The other contributor is a professional designer. He will lead on design, accessibility and navigation, and
the site should not have a "developer-made" look. The component base must leave the visual design fully to
him while being accessible by default.

## Decision

- **React Aria Components** (Adobe) as the component base. They are unstyled and handle keyboard, screen
  readers, touch and pt-BR date and number formats.
- **Tailwind CSS** with **design tokens** (colors, typography, spacing, radii, shadows) as CSS variables in
  the theme. The designer owns the tokens. Components use only tokens, never raw values.
- **Storybook** as the meeting point between design and code. Every component and screen state (empty,
  loading, error, long nicknames, phone width) can be viewed without the backend, using an API mocked with
  **MSW**.
- **WCAG 2.2 AA** as the target, with **axe** checks in Storybook and in Playwright end-to-end tests, run in CI.

## Consequences

- More visual work up front than a pre-styled kit, but the look is the designer's, not a library's.
- Automatic checks catch contrast, missing labels and focus-order regressions. The designer reviews what
  tools cannot judge, such as whether navigation makes sense.
- The design tool is still open. Whatever he uses, the tokens live in the code.

## Alternatives considered

- **shadcn/ui.** A faster start with ready-styled components on Radix. Rejected because its default look is
  very recognizable and tends to creep back in unless fully restyled.
- **Filament** (server-rendered admin panel). Dropped with the server-rendered approach.
