# Statistics ("Estatísticas")

Status: **Draft** for designer review.

## Goal

Let players see the league's records: who scored most, who won most, the biggest pots and where the nights were.

## Who

Everyone logged in: players, results keepers and admins.

## Rules

1. **"Estatísticas"** has two views: **"Temporada"** (the selected season, see
   [seasons-and-nights.md](seasons-and-nights.md) rule 3a) and **"Geral"** (every season). Both show the same lists
   and charts.
2. Only **finished nights** count. Archived nights do not count, and "Geral" also leaves out archived seasons.
   A Main Event night has no pot and no points, so it does not count ([main-event.md](main-event.md)). An extra
   night counts like any other.
   Inactive players count: the lists are the league's history.
3. Each list shows the **first 10**, highest first:
   - **"Pontuação Total"**: players by total points.
   - **"Eventos Pontuando"**: players by the number of nights on which they scored.
   - **"Posição: 1º"**, "2º" and so on, one list per scoring position: players by the times they finished there.
   - **"Maiores Potes"**: nights by pot.
   - **"Locais"**: places by the number of nights. A night with no place is not counted.
4. **Ties** work as in the standings ([points-and-standings.md](points-and-standings.md)): equal values share a
   position and the next one skips (1, 2, 2, 4). When the 10th line is tied with lines that do not fit, the list
   says how many: "e mais 2 empatados".
5. **"Pontos acumulados"** is a line chart of the running total of the **eight players with most points**: one step
   per night in "Temporada", one step per season in "Geral". The box of a point lists the players by their total
   at that point, highest first.
6. **"Vitórias"** is a bar chart of the "Posição: 1º" list, with the first places of everyone else added up as
   "Outros".
7. The view also shows how many nights it counts and their total pot. The Main Event pots and the time chips of
   those nights are added up too; "Resultados" shows the three totals of the season. A site with no Main Event
   pot or no time chip does not show that total.
8. **A player's statistics** are on the player's page ([players.md](players.md), rule 11). They have the same two
   views, "Temporada" and "Geral", and count the same nights (rule 2).
9. The player's **numbers**:
   - **"Posição"**: the player's position by total points among everyone who scored, in the season or over
     every season. Ties share a position (rule 4). A player who did not score has none.
   - **"Pontos"**, **"Eventos pontuando"** and **"Vitórias"** (first places).
   - **"Posições"**: how often the player finished in each scoring position. A position the player never
     reached shows 0.
10. **"Por temporada"**, in "Geral" only: one line for each season in which the player scored, newest first, with
    the player's position in that season's standings, points, nights scored and first places.
11. **"Resultados"**: the nights on which the player scored, newest first, with the finishing position and the
    points. Each line links to the night. "Geral" also names the season.
12. The player's **charts**: **"Pontos acumulados"**, a line of the player's running total, with one step per
    night in "Temporada" and one per season in "Geral"; and **"Posições"**, a bar for each scoring position. The
    line stays flat on a night or season in which the player did not score.

The site stores only the scoring positions of a night, not everyone who played. So a player's page cannot say
how many nights they played, only on how many they scored.

## Examples

Ana, Breno and Carla. Season A has two nights and season B has one. A R$ 300,00 pot pays 114,00 / 69,00 / 45,00
and a R$ 400,00 pot pays 152,00 / 92,00 / 60,00 to the first three.

| Night | Season | Pot | Place | 1st | 2nd | 3rd |
|---|---|---|---|---|---|---|
| 1 | A | R$ 300,00 | Casa do Ana | Ana | Breno | Carla |
| 2 | A | R$ 400,00 | Bar do Zeca | Breno | Carla | Ana |
| 3 | B | R$ 300,00 | Casa do Ana | Ana | Carla | (nobody) |

- **Total points, every season.** Ana 288,00 (114 + 60 + 114), Breno 221,00, Carla 206,00.
- **Total points, season A only.** Breno 221,00, Ana 174,00, Carla 137,00.
- **Nights scored, with a tie.** Ana 3 and Carla 3 share 1st; Breno, with 2, is 3rd.
- **Finishing positions.** 1st: Ana 2, Breno 1. 2nd: Carla 2, Breno 1. 3rd: Ana 1 and Carla 1 share 1st.
- **Biggest pots.** Night 2 (R$ 400,00) is 1st; nights 1 and 3 (R$ 300,00) share 2nd. The total pot is R$ 1.000,00
  over 3 nights. Each night sets aside a tenth of its pot for the Main Event and R$ 20,00 of time chips: the
  totals are R$ 100,00 and R$ 60,00.
- **Places.** Casa do Ana 2, Bar do Zeca 1. If night 3 had no place, Casa do Ana and Bar do Zeca would have 1 each.
- **Points per night.** In season A the chart has two steps: Breno 69,00 then 221,00; Ana 114,00 then 174,00;
  Carla 45,00 then 137,00.
- **Points per season.** In "Geral" the chart has two steps, the end of A and the end of B: Ana 174,00 then
  288,00; Breno 221,00 then 221,00; Carla 137,00 then 206,00.
- **The cut at ten.** Twelve players won one night each: "Posição: 1º" shows ten, all in 1st, and "e mais 2
  empatados"; "Vitórias" shows ten bars and "Outros: 2".
- **A player, every season.** Ana is 1st with 288,00, scored on 3 nights and won 2. Her positions: 1st 2, 2nd 0,
  3rd 1.
- **A player, one season.** In season A, Ana is 2nd with 174,00, scored on 2 nights and won 1.
- **A player, season by season.** Ana: season B, 1st, 114,00, 1 night, 1 win; then season A, 2nd, 174,00, 2
  nights, 1 win. Breno has only season A: 1st, 221,00, 2 nights, 1 win.
- **A player's results.** Ana: night 3, 1st, 114,00; night 2, 3rd, 60,00; night 1, 1st, 114,00.
- **A player's points.** Ana in season A: 114,00 then 174,00. Ana in "Geral": 174,00 then 288,00. Breno in
  "Geral": 221,00 then 221,00, because he did not play in season B.
- **A player who never scored.** Dudu has no position, 0,00 points, 0 nights and 0 in every finishing position.
  "Por temporada" and "Resultados" are empty.

## Screens

- **"📊 Estatísticas"** in the menu, after "Jogadores". It is not on the phone's bottom bar, which is full.
- A switch **"Temporada" / "Geral"**. Each view has its own address, so it can be shared.
- The line "N eventos · Pote total R$ …", the two charts, then the lists. On a wide screen "Pontos acumulados"
  takes three quarters of the width and "Vitórias" one quarter; on a phone each takes the full width. Each chart has "Ver dados em tabela",
  which shows the same numbers as a table.
- "Maiores Potes" links to each night; in "Geral" it also names the season.
- **"Resultados"** also shows the season's "Pontos acumulados" chart, below "Próximos eventos" and above the
  finished nights. The box "Totais da temporada" adds up the season's three amounts: "Pote Total", "Pote ME" and
  "Time chip". On a wide screen it is at the right of the chart, with a quarter of the width; on a phone it is
  under the chart. A season with no finished night has neither the chart nor the box.
- **The player's page** has its own "Temporada" / "Geral" switch, each with its own address. Under it: the
  numbers, "Por temporada" (in "Geral"), the two charts with "Ver dados em tabela", then "Resultados". A player
  who did not score sees "Ainda não pontuou" in place of the charts and lists.

## Open questions

- Which view opens first. It is "Temporada" for now, like the other season screens.
- A table of every player by finishing position, and new lists such as podiums and averages, were offered and not
  chosen for now. One player's finishing positions are on the player's page (rule 9).
- Should a player's "Pontos acumulados" in "Geral" start at the player's first season, instead of showing a flat
  line at zero for the seasons before it?
