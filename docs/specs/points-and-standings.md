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
5a. Between the player and the points, the standings table has **a column for each scoring position** ("1º",
   "2º" and so on), with the times the player finished there in the season. A position the player never
   reached shows a dash, and the highest number of each position is marked, as in "Posições" of the statistics
   ([statistics.md](statistics.md), rule 3c). The order is still by points. A phone has no room for these
   columns: under each nickname it says the nights scored and the wins.
6. Standings are **never stored**. They are calculated from the results each time, so a correction changes
   them at once.
7. The **ranking simulator** ("Simulação") takes an imagined pot and finishing order for the next night, and
   shows the current and simulated standings side by side, with how many places each player moves. Nothing is
   saved.
8. **A season has two champions**, and in the league each wins a trophy:
   - the **season champion** ("Campeão"), the 1st place of the season's final standings, by points;
   - the **Main Event champion**, the 1st place of the season's Main Event, on a site with the Main Event
     ([main-event.md](main-event.md)).

   Players who share the 1st place of the final standings are all season champions. An open season has no
   champion yet: its standings are not final.
9. **"Campeonato"**: once a season is finished, "Classificação" shows the **first three of its final standings**
   in a box above the standings table, with a medal each (🥇, 🥈, 🥉). It looks like the Main Event box
   ([main-event.md](main-event.md), rule 10a) and comes before it. Players who share a place share its medal,
   so the box can show more than three players. A season that is not finished, or that has no finished night,
   has no box. The statistics count the seasons' titles ([statistics.md](statistics.md), rule 13a).

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
  two nights: Breno 183.00, Ana 159.00. Breno's line shows 1 under "1º", 1 under "2º" and a dash under "3º";
  Ana's shows 1, a dash and 1.
- **Correction.** Night 2 is corrected so that Ana finished 1st and Breno 3rd. Ana now has 228.00 and Breno
  114.00. The standings change without any other step.
- **Simulator.** After the correction, a simulated R$ 400 pot where Breno finishes 1st (152.00) and Ana
  doesn't score shows Breno 266.00 ahead of Ana 228.00, with Breno moving up one place. Nothing is saved.
- **Two champions.** Liga 2025 is finished. Its standings end Breno 221.00, Ana 174.00, Carla 137.00 and Dudu
  100.00, and Carla wins its Main Event. Breno is the season champion and Carla the Main Event champion.
  "Classificação" shows the box "Campeonato" with 🥇 Breno, 🥈 Ana and 🥉 Carla, and the Main Event box under it.
- **A shared 1st place.** A finished season ends Ana 228.00, Breno 228.00 and Carla 137.00. Ana and Breno are
  both season champions. The box shows 🥇 1º Ana, 🥇 1º Breno and 🥉 3º Carla.
- **Not finished yet.** While Liga 2026 is open, Breno leads its standings. It has no "Campeonato" box.

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
