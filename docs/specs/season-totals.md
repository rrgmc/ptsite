# Seasons known only by their final standings

Status: **Draft** for designer review

## Goal

A league may have played seasons before it used the site, and kept only their final standings: each player's
total points and how often the player finished in each scoring position. The results of each night are lost.
The site keeps such a season ("só totais") so that its standings, its champion and its finishes count in the
statistics, with nothing invented.

## Who

Admins save the final standings, through the API. Everyone sees them like any season's standings.

## Rules

1. **A season known only by its final standings has a final line for each player who scored**: the total points,
   and how many times the player finished in each scoring position. It has no regular night. Its rounds
   ("Rodadas") are the nights it had.
2. **Each player is listed once.** Each line gives a count, zero or more, for every scoring position of the
   season's percentage table, and points of zero or more.
3. **The final standings are kept as the league recorded them.** The counts of a position need not add up to the
   season's rounds: a hand-kept table may miss a finish or have an extra night, and the site does not correct
   it.
4. **Saving the final lines replaces the ones saved before.** Saving the same lines twice changes nothing.
   Saving none clears them, and the season is an ordinary season again.
5. **A season with a regular night takes no final lines**, and an archived season takes none either. A season
   with final lines takes no regular night, and has no "Simulação". Its Main Event can still be recorded.
6. **The percentage table of such a season cannot change** while it has final lines, because it gives the
   positions of the lines.
7. **The standings** follow [points-and-standings.md](points-and-standings.md): the players are ranked by their
   total points, and tied players share a rank. The nights scored are the finishes added up, and the wins are
   the 1st places.
8. **The statistics count such a season** like the nights it stands for: in the total points, the nights scored,
   the finishes in each position, the medal table, the number of nights, a player's page and the
   "Campeonatos" lists once the season is finished. It has no pot, no place and no night of its own, so it is
   not in the pots, the biggest pots, the places, the results of a player, or a progress night by night.
   Over every season, where the progress has one step per season, it is a step.

## Examples

A season with 3 rounds and the standard table of 6 scoring positions, "Temporada antiga", has these final
lines:

| Player | Points | 1º | 2º | 3º | 4º | 5º | 6º |
|---|---:|---:|---:|---:|---:|---:|---:|
| Ana | 250.50 | 2 | 0 | 0 | 1 | 0 | 0 |
| Breno | 180.00 | 1 | 1 | 0 | 0 | 1 | 0 |
| Carla | 120.00 | 0 | 1 | 1 | 0 | 0 | 1 |
| Davi | 90.00 | 0 | 1 | 1 | 0 | 0 | 0 |
| Elisa | 60.00 | 0 | 0 | 1 | 1 | 1 | 0 |
| Fábio | 30.00 | 0 | 0 | 0 | 1 | 0 | 1 |
| Gabi | 12.50 | 0 | 0 | 0 | 0 | 1 | 1 |

Each column adds up to 3, the rounds, but that is not required (rule 3).

1. **Standings.** Ana is 1st with 250.50 points, 3 nights scored and 2 wins. Gabi is 7th with 12.50 points and
   2 nights scored.
2. **A tie.** With Davi at 120.00 points too, Carla and Davi share the 3rd place, and Elisa is 5th.
3. **A column that does not add up.** With Breno at 2 wins instead of 1, the 1st places add up to 4 in 3
   rounds. The site keeps the lines, and Breno has 2 wins and 4 nights scored.
4. **A player twice.** Two lines for Ana are refused: "Este jogador aparece duas vezes."
5. **No night.** Scheduling or importing a regular night in "Temporada antiga" is refused: "Esta temporada tem
   só o resultado final: não recebe eventos." Saving final lines for a season with a finished night is refused:
   "Esta temporada já tem eventos: o resultado final vem deles."
6. **Every season.** A later season, "Temporada nova", has one night with a R$ 300 pot that Ana won (114.00
   points). Over every season:
   - Ana has 364.50 total points and 3 wins, and 4 nights scored;
   - the league has 4 nights, and its pots add up to R$ 300.00, the night's only;
   - the biggest pots list only that night;
   - the progress has two steps, "Temporada antiga" then "Temporada nova", and Ana's line is 250.50 then 364.50.
7. **The champion.** Once "Temporada antiga" is finished, Ana has 1 title in "Campeonatos".
8. **A player's page.** Ana's page lists "Temporada antiga": 1st, 250.50 points, 3 nights, 2 wins. It lists no
   result of a night in it.

## Screens

- The standings ("Classificação") of such a season show the note "Só o resultado final: não há resultados por
  evento.", and take the number of nights from its rounds. They have no last result, next night or
  "Simulação".
- The results ("Resultados") of such a season show the same note instead of a list of nights.
- The seasons lists show the badge "Só totais".
- Admins see no button to add, import or plan nights for such a season.
- Its statistics have no progress, pots or biggest pots.

## Open questions

- There is no screen to type the final lines in: an importer saves them through the API.
