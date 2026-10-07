# 15. Recharts for charts, loaded only with the statistics

- Status: Proposed. The point "Five chart color tokens" is replaced by
  [0020](0020-eight-chart-colors.md).
- Date: 2026-10-03

## Context

The statistics page ([statistics.md](../specs/statistics.md)) has two charts: the leaders' running totals as lines
and the first places as bars. The frontend had no chart library.

A chart here must follow the same rules as any screen ([0005](0005-ui-design-system.md)): colors from the design
tokens, WCAG 2.2 AA under axe, phone width first.

## Decision

- **Use Recharts 3.** It draws SVG, so a mark takes its color from a token (`stroke="var(--color-chart-1)"`) and
  axe can read the result. It supports React 19 and gives axes, tooltips and resizing without extra code.
- **Load it only with the statistics.** The statistics routes are a separate bundle, as the admin section is. The
  bundle is about 380 kB (110 kB gzipped); the main bundle does not grow.
- **Five chart color tokens**, `--color-chart-1` to `--color-chart-5`, in a fixed order: a series takes the
  color of its place and a chart never has more than five series. Chart text uses the text tokens. The values are
  placeholders, like the other tokens, checked for color-blind separation on a white surface.
- **Every chart has a text alternative.** The chart is one image with a short description, a legend names the
  series, and "Ver dados em tabela" shows the same numbers as a table. Three of the five colors are below 3:1 on
  white, so the legend and the table are required, not optional.
- **No animation**, so that the accessibility tests see a finished chart and nothing moves for people who ask for
  reduced motion.
- Chart sizes that are not tokens (tick text of 12 px, line width, bar height) stay inside
  `features/statistics/StatisticsCharts.tsx`.

## Consequences

- One more dependency, and a second lazy bundle.
- In jsdom a chart has no size and draws nothing. Unit tests cover the data mapping (`chartData.ts`); Storybook
  and the end-to-end tests cover the drawn chart.
- A dark theme would need its own chart colors, checked against the dark surface.

## Alternatives considered

- **visx.** Smaller and fully controllable, but axes, tooltips and resizing are hand-built. Too much code for two
  charts.
- **Chart.js (react-chartjs-2).** It draws on a canvas: it cannot read CSS variables without JavaScript, and axe
  and screen readers see nothing inside it.
- **Nivo, Victory.** Themes are JavaScript objects, not CSS variables, and neither is lighter than Recharts.
- **Bars drawn with CSS, no library.** Enough for the first places, not for the line chart.
- **A pie of first places.** It needs one color per player and compares close values badly. Bars need
  one color.
