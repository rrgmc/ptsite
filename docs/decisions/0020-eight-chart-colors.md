# 20. Eight chart colors, for a line chart of eight players

- Status: Proposed
- Date: 2026-10-04

## Context

[0015](0015-chart-library.md) set five chart color tokens and said that a chart never has more than five series.
The league wants "Pontos acumulados" to show the eight players with most points instead of five
([statistics.md](../specs/statistics.md), rule 5).

## Decision

- **Eight chart color tokens**, `--color-chart-1` to `--color-chart-8`, in a fixed order. A series still takes
  the color of its place, and a chart never has more than eight series. The first five values do not change.
- **The box of a point lists its series by value, highest first**, so that with eight lines the order in the box
  is the order of the lines at that point.
- The rest of 0015 stands: the legend and "Ver dados em tabela" are still required.

## Consequences

- Eight lines are harder to tell apart than five, by color alone even more. The three new values are
  placeholders and were not checked for color-blind separation, so the legend, the sorted box and the table carry
  more of the reading.
- The legend takes more lines on a phone.

## Alternatives considered

- **Keep five colors and tell the other lines apart by dashes.** Dashed lines are hard to follow where eight
  lines cross.
