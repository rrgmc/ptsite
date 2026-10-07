# Season calendar ("Calendário")

Status: Agreed.

## Goal

Let every player see when the season's nights are, who won the ones already played, and why a usual Friday has no
night.

## Who

Everyone logged in: players, results keepers and admins.

## Rules

1. The **"Calendário"** tab shows the selected season (the current one unless another is picked in "Escolher temporada",
   see [seasons-and-nights.md](seasons-and-nights.md) rule 3a), as month calendars.
2. It shows the season's **nights**: finished ones with the **winner** (1st place) and the **pot**; scheduled and
   open ones with the time and the place. An open night also shows how many players answered **ALL IN** and
   **your own answer**; a scheduled night takes no answers yet (see [attendance.md](attendance.md)), so it shows
   them only if it already has some. On the grid, a finished night is a filled green circle (played) and a
   scheduled or open night an outlined one (still to come).
3. It shows **"Sem evento"** on the regular nights that are not played because of a holiday, an emenda or
   Carnival, with the reason. These are the same dates the [season planner](season-planner.md) leaves out,
   following the season's own rhythm (rule 9 there).
3a. **Every holiday is easy to see**: holidays have their own color on the grid, and each month lists its holidays by
   date and name, whether or not they fall on a night. A Friday that is itself the holiday gets one line.
4. The calendar runs from the season start to the later of its last night and the end of the start year. A finished
   season stops at its last night.
5. **The next night** is highlighted and shown at the top. The calendar opens at the top of the page, like every
   other screen. **"Ver no calendário"**, under the next night, goes to its month.
5a. **Today** has a ring around it on the grid, whatever kind of day it is, and the legend shows "Hoje". The
   month of today has a slightly different background color from the other months. When
   no night is coming, **"Ir para hoje"** goes to today's month. A season that does not include today shows none of
   these. Neither button is shown when its month is the first one, which is already at the top.
6. Archived nights are not shown.
7. Each night opens the night page.

## Examples

A season starting on 01/01/2027, Fridays every other week, with the `sao-paulo` holiday preset (see [season-planner.md](season-planner.md), rule 3).

- **Nights and holidays together.** The season has a finished night on 12/03 won by Ana (pot R$ 840,00) and a
  scheduled night on 02/04. The calendar shows: 01/01 Sem evento (Feriado: Confraternização Universal), 05/02 Sem
  evento (Carnaval), 12/03 🏆 Ana · R$ 840,00, 26/03 Sem evento (Feriado: Sexta-feira Santa), 02/04 and, later,
  28/05 Sem evento (Emenda: Corpus Christi).
- **Answers.** The night of 02/04 is open and two players answered ALL IN, one of them you: 02/04 shows
  "2 ALL IN · Você: ALL IN". Still scheduled and with no answers, it shows only the time and the place.
- **A finished season.** The same season, finished after 12/03, stops there: 01/01, 05/02 and 12/03.
- **Today.** On 10/03/2027, a Wednesday with no night, 10/03 has the ring and the next night, 12/03, keeps its
  highlight. On 12/03 the same day has both. On both days March has the different background and the other
  months do not.
- **Today in a finished season.** On 20/02/2027, with every night finished, the calendar opens at the top and
  "Ir para hoje" goes to February.
- **A season in 2022.** With 24 nights, April lists Thursday 21/04 (Feriado: Tiradentes) and Friday 22/04 (Sem
  evento · Emenda: Tiradentes).

## Screens

- Tab **"📅 Calendário"**, between "Resultados" and "Simulação".
- A legend (with "Hoje" when today is on a grid), then one grid per month (Sunday first, as in Brazilian calendars). Under each grid, the month's nights,
  "Sem evento" days and holidays in words, each with a dot in its grid color.

## Open questions

- Add to the phone's calendar (a calendar subscription link) was offered and not chosen for now.
