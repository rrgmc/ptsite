# Points and standings

Status: **Draft, for designer review.**

## Goal

Turn each night's result into points, and the points into the season's standings.

## Who

Everyone sees points and standings. Nobody enters points by hand: they are always calculated.

## Rules

1. **Points are money.** Each scoring position receives its percentage of the night's pot:

   > points = pot × percentage for that position ÷ 100

2. Only the scoring positions earn points. Everyone else earns nothing that night.
3. Points are calculated to the cent. On every night the points add up exactly to the pot.
4. A player's **season total** is the sum of their points from every **finished** night in the season.
5. **Standings** ("Classificação") rank players from the highest total to the lowest. Players who have not
   scored yet don't appear.
6. Standings are **never stored**. They are calculated from the results each time, so a correction changes
   them at once.
7. The **ranking simulator** ("Simulação") takes an imagined pot and finishing order for the next night, and
   shows the current and simulated standings side by side, with how many places each player moves. Nothing is
   saved.

## Examples

Names and figures are invented. All examples use the percentage table **38, 23, 15, 11, 8, 5**.

- **A R$ 300 pot:**

  | Position | % | Points |
  |---|---|---|
  | 1st | 38 | 114.00 |
  | 2nd | 23 | 69.00 |
  | 3rd | 15 | 45.00 |
  | 4th | 11 | 33.00 |
  | 5th | 8 | 24.00 |
  | 6th | 5 | 15.00 |
  | **Total** | **100** | **300.00** |

- **A R$ 845 pot:** 1st 321.10, 2nd 194.35, 3rd 126.75, 4th 92.95, 5th 67.60, 6th 42.25. Total 845.00.
- **Standings.** Ana scored 114.00 on night 1 and 45.00 on night 2. Breno scored 69.00 and 114.00. After
  two nights: Breno 183.00, Ana 159.00.
- **Correction.** Night 2 is corrected so that Ana finished 1st and Breno 3rd. Ana now has 228.00 and Breno
  114.00. The standings change without any other step.
- **Simulator.** After the correction, a simulated R$ 400 pot where Breno finishes 1st (152.00) and Ana
  doesn't score shows Breno 266.00 ahead of Ana 228.00, with Breno moving up one place. Nothing is saved.

## Main Event

The Main Event gives no points: its night records only the order of its players, and is left out of the
standings and of the simulator ([main-event.md](main-event.md)). The Main Event pot and the time chip of a night
give no points either. An extra night scores like any other ([seasons-and-nights.md](seasons-and-nights.md),
rule 28).

## Open questions

- **Ties.** There is no tie-breaker. The standings show tied players with the same rank (1, 2, 2, 4) and lists them in a fixed order. Should there be a
  tie-breaker, for example the most 1st places? The standings already return each player's wins.
- **Rounding.** If a pot ever gives fractions of a cent, which position gets the leftover cent?
- **Simulator limits.** Only players who already have points appear in the simulated standings. Keep that?
