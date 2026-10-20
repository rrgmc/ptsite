# 23. Ten chart colors, for line charts of ten players

- Status: Proposed
- Date: 2026-10-20
- Supersedes: the eight-color limit of [0020](0020-eight-chart-colors.md)

## Context

[0020](0020-eight-chart-colors.md) set eight chart color tokens, so a chart had eight series at most. The league
wants "Pontos acumulados" to show the ten players with most points, and a new chart, "Classificação por
temporada", to show the same ten ([statistics.md](../specs/statistics.md), rules 5 and 5a).

## Decision

- **Ten chart color tokens**, `--color-chart-1` to `--color-chart-10`, in a fixed order. The first eight values
  do not change. A line chart has ten series at most.
- **The pie of "Locais" keeps eight colors**: seven places and "Outros". It is not a chart of players, and more
  slices would be harder to read.
- The rest of 0020 stands: the legend, the sorted box of a point and "Ver dados em tabela" are still required.

## Consequences

- Ten lines are harder to tell apart than eight. The two new values, a cyan and an olive, are placeholders too,
  and were not checked for color-blind separation. The legend, the sorted box and the table carry the reading.
- The legend takes one more line on a phone.

## Alternatives considered

- **Keep eight colors and dash the last two lines.** Two styles of line in one chart read as two kinds of data.
