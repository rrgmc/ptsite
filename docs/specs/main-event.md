# Main Event

Status: **Draft** for designer review.

## Goal

A league may end each season with a **Main Event**: a final game for the season's best players. So a season
has two champions, the one of its standings and the one of its Main Event. The Main Event gives no points. The
league only wants to know who played it and in which order they finished.

The Main Event is still a gathering like any other: it has a date and a place, players confirm that they are
coming, and it shows as the next night. So it is a night of the season, of a type of its own.

A site has the Main Event only if it turns it on (`mainEvent` in `features`, see
[`site/README.md`](../../site/README.md)). It is off unless the site says otherwise.

## Who

- **Results keepers and admins** schedule, open and finish the Main Event night, as they do any night.
- **Everyone logged in** sees it.

## Rules

1. A night has a **type**: regular, or **Main Event**. The type is chosen when the night is scheduled ("Tipo")
   and does not change afterwards.
2. **A season has at most one Main Event night.** It belongs to the season it is the Main Event of, whenever it
   is played. A cancelled one does not count, so another can be scheduled.
3. A Main Event night is scheduled, moved, cancelled, edited and opened **like any other night**, by the same
   people (rules 7, 8, 16, 17 and 17a of [seasons-and-nights.md](seasons-and-nights.md)). While it is open it
   takes attendance answers ([attendance.md](attendance.md)). Its title is "Main Event - 12/12/2026".
4. A Main Event night is **always extra** (rules 25 to 29 of [seasons-and-nights.md](seasons-and-nights.md)): it
   is not a round of the season and it may share its day with another night.
5. **Finishing a Main Event night** records its **players in finishing order**: the 1st place, then the 2nd, and
   so on, **as many as are known**. Only the 1st place is required. No position is skipped, and the same player
   cannot appear twice. Any active or inactive player can be entered; an archived one cannot.
6. A Main Event night has **no pot, no Main Event pot, no time chip and no points**, and no partial result. It is
   left out of the standings, the simulator, the statistics and the players' statistics.
7. A finished Main Event night can be **corrected** at any time, by whoever can finish it, also after its season
   is finished. The change is recorded in the audit log.
8. **A Main Event that was already played** is recorded in one step: its date, its place and its players in
   order. It is saved as finished. A finished season takes it too, since a Main Event is often played after the
   season's last round.
9. **"Main Event"**, in the menu, shows the Main Event of the selected season: the day, time and place of its
   night, and its players in order once it is finished. Before that it says that the Main Event was not played
   yet, or not scheduled yet. On a site with the Main Event pot, it also shows the **season's Main Event pot**:
   the Main Event pots of the season's finished nights, added up.
10. **"Temporadas"** shows the **Main Event champion** of each season that has a finished Main Event.
11. On "Resultados", the calendar, the next night's card and the attendance banner, a Main Event night is marked
    **"Main Event"**. On "Resultados" its card lists the players in order, with no amounts and no number.
12. **The points of the day are not the Main Event's.** When the players of a Main Event also score in a round,
    that round is another night, entered on its own. The two results are not compared.
13. **On a site with no Main Event**, a night cannot be given this type, "Main Event" is not in the menu, and
    "Temporadas" shows no Main Event champion. Main Event nights already recorded stay in the database.

## Examples

- **The champion alone.** An old Main Event of which only the winner is remembered is recorded with one player.
  It is valid.
- **Nine players.** A Main Event with nine players is finished with nine positions, 1st to 9th.
- **Twelve players.** A list longer than ten is valid: there is no fixed number of positions.
- **No 1st place.** Finishing with no player is refused: "Informe pelo menos o 1º colocado."
- **The same player twice.** Ana is entered 2nd and 4th. It is refused at the 4th position: "Este jogador já
  está na 2ª posição."
- **A pot on a Main Event night.** Finishing a Main Event night with a pot and scoring positions is refused:
  "Este evento é um Main Event: informe a ordem dos jogadores, sem pote."
- **A second Main Event.** A season already has a Main Event night. Scheduling another is refused: "Esta
  temporada já tem um Main Event."
- **Played after the season.** Liga 2025 is finished. Its Main Event, played months later, is recorded in one
  step with its date and players. Liga 2025 then shows its Main Event champion in "Temporadas".
- **A Main Event day.** On Saturday 12/12/2026 the league plays the Main Event of Liga 2026, and the same
  players also score as a round. The Main Event night of Liga 2026 is opened, takes the answers and is finished
  with the players in order. The round is another night, scheduled and finished on its own with its pot.
- **Not in the standings.** Breno wins the Main Event and never scored in the season. He is not in the season's
  standings, and the season's statistics count the same nights as before.

## Open questions

- **Who qualifies.** The site does not list the players who qualified for the Main Event, and does not check the
  players entered against the standings. Should it?
- **A Main Event with no season of its own.** Every Main Event belongs to one season. A final between seasons
  has no place yet.
