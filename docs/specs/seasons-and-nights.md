# Seasons and game nights

Status: **Draft, for designer review.** Everything here can be changed.

## Goal

Run a season of game nights: schedule a night, open it, play, enter the results.

## Who

- **Admins** create seasons and their percentage tables.
- **Results keepers** and **admins** schedule, open and finish nights and enter results.
- **Players** see nights and results.
- **Active players** fill the partial result of the open night.

## Rules

### Seasons ("Torneio")

1. A season has a name, a start date, a default place and a description.
2. A season has a **number of scoring positions** (usually 6) and a **percentage table**: the
   share of the pot each scoring position receives. The shares must add up to **100%**; otherwise the table
   cannot be saved.
3. A season is **open** while it is being played and **finished** when it is over. The **current season** is
   the newest open season.
3a. **A season has its own addresses.** The standings, the results, the calendar, the simulator, the statistics,
   the Main Event and a player's page are the **season screens**: each shows one season, the **selected season**.
   The address says which. With no season in it (`/results`) it is the current season; if no season is open, it
   is the newest season. With a season in it (`/seasons/7/results`) it is that season, on the same screen. So a
   link, a bookmark and the browser's "back" all lead to the season they were made for.
3b. **"Escolher temporada"** lists every season, newest first, in a table titled "Temporadas". Each season is a
   row with one value per column: its name, its start date ("Início"), its number of rounds scheduled
   ("Eventos"), how many were played ("Finalizados"), and whether it is the current one ("Atual"), finished,
   open or closed ("Situação"). On a phone the two counts are hidden. It marks the selected season. "Administração" lists the seasons in the same
   table, with each season's actions in a last column. Everyone
   logged in can open it, from the season name at the top of every screen.
3c. **Picking a season** in that list opens the season screen the list was opened from, at that season's address;
   the standings when it was opened from another screen. Picking the current season opens the address with no
   season in it. From a season screen, the menu and the links to other season screens keep the season: the
   results of Liga 2022 lead to the calendar of Liga 2022.
3c1. **Screens with no season of their own** ("Jogadores", "Temporadas", a night, the admin section) remember the
   last season the browser tab showed. Their header names it, and their menu leads back to its addresses. This
   memory lasts until the user opens another season, closes the browser tab or logs out ("Sair"). It never decides
   what a season screen shows: the address does. Two links name a season of their own instead: cancelling a night
   leads to the results of that night's season, and the season planner to the calendar of the season it planned.
3d. While the selected season is not the current one, the season screens say so ("Você está vendo Liga 2022, que
   não é a temporada atual.") and offer **"Voltar para a atual"**, which opens the same screen at the address with
   no season in it. The current season at its own address (`/seasons/12/results`) shows no notice and stays at
   that address.
3e. The address of a season that does not exist or was archived leads to the same screen of the current season.
3f. **"Temporadas"**, in the menu, shows every season, newest first, each with the **first ten of its standings**:
   position, photo, nickname and points. On a wide screen two seasons stand side by side, each with its ten in
   one list. A finished season shows its final standings and the current season its standings so far. When the
   tenth place is shared, ten players are shown and the list says how many tied players did not fit ("e mais 2
   empatados").
   A season with no finished night says so. **"Ver esta temporada"** opens a season's standings, at that season's
   address; the selected season shows "✓ Selecionada" instead. Everyone logged in can open it.
4. A night belongs to a season explicitly. A night's season cannot be worked out from its date, because
   seasons no longer follow the calendar year.
5. A season has a **regular night**: a weekday, a start time and a frequency (for example Friday at 21:30, every
   2 weeks). A new season starts with the previous season's regular night; the very first one defaults to Friday
   at 21:00, every 2 weeks. It is only used for suggestions and for the
   [season planner](season-planner.md).
5a. A season has a number of **rounds** ("Rodadas"): how many nights it has, usually 26, not counting the extra
   nights (rule 25). A new season starts with the
   previous season's number. It is a target, not a limit: scheduling a night past it shows a warning ("A temporada
   já tem 26 eventos de 26 rodadas") but is allowed.
5b. A season has its **money settings** ("Valores"): what a night of the season costs. An admin sets them on the
   season's page in "Administração". Each one is optional unless a rule below says otherwise:
   - the **buy-in**: what a player pays to enter a night;
   - the **time chip value**: the price of one time chip, on a site with the time chip (rule 9c);
   - the **rebuys allowed** ("Rebuys permitidos"): how many rebuys a player can make on a night, from 0 to 20.
     A new season starts with 0;
   - whether a player can make **rebuys past the limit** ("Permitir rebuys além do limite"). Those rebuys do not
     count for the season's points;
   - the **rebuy value**: the price of a rebuy, without the time chip it may also charge;
   - whether **a rebuy also pays the time chip** ("O rebuy também paga o time chip"), on a site with the time chip;
   - the **house owner's buy-in** ("Buy-in do dono da casa"): the smaller buy-in of the owner of the house where
     the night is played, on a site that turns this on (`houseOwnerBuyIn` in `features`,
     [`site/README.md`](../../site/README.md));
   - the **Main Event pot share** ("Pote ME: % do pote"): the share of a night's pot, from 0 to 100%, that the
     night dashboard suggests as the night's Main Event pot, on a site with the Main Event pot and the night
     dashboard.
5c. **A season has rebuys** when it allows at least one, or allows rebuys past the limit. A season with rebuys
   must have a rebuy value. A season with 0 rebuys and none past the limit has no rebuys: its form shows no
   rebuy value and no "O rebuy também paga o time chip".
5d. The house owner's buy-in needs a buy-in, and cannot be above it. It can be the same, or zero.
5e. **On a site with the night dashboard, a night's money is worked out from these settings**: the dashboard
   records each player's buy-in, rebuys and time chip, and "Finalizar" starts from the amounts it adds up
   ([night-dashboard.md](night-dashboard.md)). On a site without it the season only records them: a night's pot
   and time chip are the totals the keeper enters (rule 9), and a night records no rebuys.
5f. A setting of a feature the site does not have is not shown, and the API refuses it. A value recorded before
   the feature was turned off stays in the database.

### Game nights ("Evento")

6. A night has a date and time, a place (the season's default place unless changed) and a description.
6a. A night's title is a word set by the site and the night's date: "Liga - 14/03/2026". The first word is the
   site's setting (`nightTitlePrefix` in its `site.json`); the demo league uses "Liga", and so do the
   examples in these specs. On "Resultados" the title also has the night's number in the season, counting the
   finished rounds from the oldest: "Liga 3 - 14/03/2026". An extra night (rule 25) has no number.
6b. A night has a **type**. Almost every night is a regular one, with a pot and points. On a site with the Main
   Event, a season can also have one **Main Event night**, which has a result of its own: see
   [main-event.md](main-event.md). The rules below about the pot, the positions and the partial result are for
   regular nights.
7. A night goes through these states: **scheduled** → **open** → **finished**.
8. **Only one night per season can be open at a time.** Opening a second night is refused until the first is
   finished.
9. **Finishing a night** ("Finalizar") records:
   - the **pot** (required, above zero);
   - the **Main Event pot** ("Pote ME", required, zero allowed): the money set aside that night for the Main Event;
   - the **time chip** (required, zero allowed): the money set aside that night for the year party. A time chip
     is paid with every rebuy, and by a player who arrives late. The keeper enters the night's total;
   - which active or inactive player finished in each **scoring position**.
9a. Only the pot counts for points. The Main Event pot and the time chip are recorded and added up per season
   ([statistics.md](statistics.md), rule 7).
9b. Wherever a finished night's result is shown (the results list and the night's page), the three amounts come
   below the positions: "Pote Total", "Pote ME" and "Time chip". An amount that was never recorded shows "—".
9c. A site can do without the Main Event pot, the time chip or both (`features` in
   [`site/README.md`](../../site/README.md)). Finishing a night then does not ask for that amount and does not
   record it, the partial result has no field for it, and it is not shown with the night's result.
10. **The same player cannot appear twice** in the scoring positions.
11. When a night is finished, the points are calculated (see
    [points-and-standings.md](points-and-standings.md)).
12. A finished night can be **corrected**. The standings change at once, and the change is recorded in the
    audit log.
13. A past night can be **imported** in one step (date, place, pot, Main Event pot, time chip, finishing
    order). It is saved as finished. It can be marked as extra (rule 25).
14. **Suggested dates.** A night is usually created early in its week (on the Monday), so when scheduling, the
    site offers the **next three regular weekdays** at the regular time, starting today (or at the season's
    start, if later). The first is chosen at the start. Today counts if it is the regular weekday. Dates that
    already have a round of the season are left out.
15. **Suggestions are only suggestions.** Any date and time can be chosen. These suggestions do not look at
    holidays: the person scheduling picks another date when needed. Planning a whole season, with holidays, is the
    [season planner](season-planner.md).
16. **Remarcar.** A scheduled night can be moved to another date and time by a results keeper or an admin. Any
    attendance answers it has stay, and so does its place. A round cannot be moved onto a day that already has
    another round of the season; an extra night can be on any day. An open or finished night cannot be moved.
17. **Cancelar.** A scheduled night can be cancelled by a results keeper or an admin, after confirming. It is
    archived, not deleted: it leaves the season's lists and calendar, its date is free again, and the audit log
    keeps it. An open or finished night cannot be cancelled; a finished night's result is corrected instead.
17a. **Editar evento.** A night's **place** and **description** can be changed on a page of their own, whatever
    the night's state. The same page marks a regular night as extra, or as a round again (rule 25). The place can be removed: the night then shows "Local a definir". A results keeper or an
    admin edits a scheduled night; **only an admin** edits an open or finished one. A cancelled night cannot be
    edited. Nothing else changes: the date, the amounts, the result and the standings stay as they are. The change
    is recorded in the audit log.
17b. The night's page shows the description, when it has one. A description is plain text. The ones imported from
    an older site may be HTML from its text editor (`<p>&nbsp;Liga - 07/26</p>`): the site shows only their text,
    and the stored value keeps its markup until someone rewrites the description.

17c. **"Próximos eventos"**, on "Resultados", lists the season's **next two** nights that are not finished,
    the earliest first. When the season has more to come, the link "Ver todos no calendário" leads to the
    calendar. **A finished season has no such box**, even with a night that was never finished.

### Extra nights ("Evento extra")

25. A night can be **extra**: outside the season's calendar. It is for what is not one of the season's rounds,
    such as a second table played on the day of another night. It is chosen when the night is scheduled ("Tipo":
    "Rodada da temporada" or "Evento extra") and can be changed in "Editar evento".
26. **An extra night is not a round.** It does not count in the season's rounds ("Rodadas: N de 26"), in the
    number of nights of a season, or in the numbers of the nights on "Resultados".
27. **An extra night may share its day** with another night. The [season planner](season-planner.md), the
    suggested dates (rule 14) and the calendar's "Sem evento" days ignore it: only the rounds carry the season's
    rhythm.
28. **An extra night scores like any night.** It is opened and finished the same way, and its pot, its Main Event
    pot, its time chip and its points count in the standings and in the statistics.
29. **Only one night per season can be open at a time** (rule 8), an extra night too. On a day with two nights,
    the first is finished before the second is opened. The second can also be imported (rule 13).
30. An extra night is marked **"Extra"** wherever a night is listed. A Main Event night is always extra
    ([main-event.md](main-event.md)).

### Partial result ("Resultado parcial")

18. While a night is **open**, it can have one **partial result**: the pot, the Main Event pot, the time chip and
    the player in each scoring position, as far as they are known. Every field is optional. It lets the players
    record the result while the night runs.
19. Any **active player** with a login can save it, and so can results keepers and admins. Inactive and archived
    players, and accounts with no player, cannot, unless they are results keepers or admins.
20. There is **one partial result per night**, shared by everyone. A save replaces all of it: the **last save
    wins**. It shows who saved last and when.
21. The same player cannot be in two positions, only the season's scoring positions exist, and archived players
    cannot be picked.
22. It gives **no points** and changes no standings. Everyone who sees the night sees it. When the pot is saved,
    the night's page shows the points each scoring position would earn from it, as the form does. They count only
    when the night is finished.
23. When a results keeper or admin opens "Finalizar", the form **starts filled** from the partial result and says
    so, with who saved it last. They change what is needed and finish as usual: all the rules of finishing apply.
24. **Finishing the night deletes the partial result.** A scheduled or finished night takes none. Saves are not
    recorded in the audit log, whoever makes them; the finish is.
24a. **On a site with the night dashboard, the dashboard holds the partial result**
    ([night-dashboard.md](night-dashboard.md), rules 13 to 15): each position is saved by itself, the pot and
    the time chip are the ones the dashboard works out, and the night's page shows the dashboard's amounts in
    place of the partial result. Rules 19, 21, 22 and 24 hold as they are.

## Examples

Names are invented.

- **Opening while another is open.** Night A (14/03) is open. The results keeper tries to open night B (21/03).
  The site says night A must be finished first.
- **Duplicate player.** The results keeper picks Ana for both 1st and 3rd place. Saving is refused and the
  form points at the duplicate.
- **Percentage table.** An admin enters 40, 23, 15, 11, 8, 5 (total 102). Saving is refused, showing "Total:
  102%".

The selected season, in the demo league (the current season, and Liga 2022, which is finished):

- **At first.** A player logs in. Every screen shows the current season, and "Escolher temporada" marks it
  "✓ Selecionada" and "Atual".
- **Picking another.** The player opens "Escolher temporada" from the results and picks Liga 2022, which is
  season 10. The site opens `/seasons/10/results`, the results of 2022. The menu leads to `/seasons/10/calendar`
  and `/seasons/10/simulator`, and a reload shows 2022 again. Each of those screens shows the notice.
- **A screen with no season.** From there the player opens "Jogadores" (`/players`). It has no notice, its header
  still names Liga 2022, and "Resultados" in its menu leads back to `/seasons/10/results`.
- **A player's page.** From the standings of Liga 2022 the player opens the champion: `/seasons/10/players/3`,
  with the champion's numbers of 2022 and the notice. "Voltar para a atual" opens `/players/3`.
- **A finished season.** A results keeper at the results of Liga 2022 sees no "+ Agendar". "Voltar para a atual"
  opens `/results`: the notice is gone and "+ Agendar" is back. The browser's "back" returns to
  `/seasons/10/results`.
- **The address with no season.** In a tab that showed Liga 2022 last, typing `/results` shows the current season.
- **The current season's own address.** The current season is season 12. `/seasons/12/results` shows its results,
  stays at that address and has no notice.
- **Logging out.** The player opens Liga 2022, logs out and logs in again: the current season is shown, and the
  header of "Jogadores" names it.
- **The first ten.** The player opens "Temporadas" from the menu. Liga 2022 is "Finalizada" and lists ten players,
  its champion first. The current season shows "✓ Selecionada" and no button. "Ver esta temporada" on Liga 2022
  opens the standings of 2022, with the notice.
- **A shared tenth place.** Eleven players scored, and the tenth and the eleventh both have 15,00. The list shows
  ten players and "e mais 1 empatado".
- **A link.** Opening `/seasons/10/results` shows the results of Liga 2022 and stays at that address.
- **A season that is gone.** Opening `/seasons/999999/results` leads to `/results`: the results of the current
  season, without the notice.

Money settings:

- **A season with rebuys.** Liga 2027 has a buy-in of R$ 50,00, 2 rebuys allowed at R$ 50,00 each, a time chip of
  R$ 5,00 that every rebuy also pays, and rebuys past the limit. All of it is saved.
- **No rebuys.** A new season has 0 rebuys allowed and none past the limit. It has no rebuys, and needs no rebuy
  value.
- **Only past the limit.** A season allows 0 rebuys but allows rebuys past the limit. It has rebuys, none of which
  counts for points, and needs a rebuy value.
- **No rebuy value.** A season with no rebuy value is changed to allow 2 rebuys: refused ("Informe o valor do
  rebuy, ou deixe a temporada sem rebuys.").
- **Too many.** 21 rebuys allowed is refused; 20 is accepted.
- **The owner of the house.** With a buy-in of R$ 50,00, a house owner's buy-in of R$ 25,00, R$ 0,00 or R$ 50,00
  is accepted. R$ 60,00 is refused ("O buy-in do dono da casa não pode ser maior que o buy-in."). So is R$ 25,00
  in a season with no buy-in ("Informe o buy-in antes do buy-in do dono da casa.").
- **A site without the time chip.** The season's form has no time chip value and no "O rebuy também paga o time
  chip", and the API refuses both.
- **A site without the house owner's buy-in.** The form does not show it and the API refuses it. A season that
  already has one can still change its buy-in.

Moving and cancelling:

- **Remarcar.** The night of 12/03/2027 is moved to 19/03/2027 at 20:00. Ana's ALL IN, given before answers were
  limited to open nights, stays; the audit log shows the old and new dates.
- **A day already taken.** 19/03/2027 already has a night: moving the 12/03 night there is refused ("Já existe um
  evento nesta temporada em 19/03/2027.").
- **Already played.** An open or finished night cannot be moved or cancelled.
- **Remarcar keeps the place.** The 12/03/2027 night is at the clubhouse. Moving it to 19/03 leaves it there.
- **Cancelar.** The 12/03/2027 night is cancelled: it leaves the season's nights, and another night can then be
  moved to 12/03.

Extra nights, in a season with 26 rounds whose regular night is Friday at 21:30:

- **A second table.** The season has a round on Friday 12/03/2027. A results keeper schedules an extra night on
  the same day. The season still has one night planned of its 26 rounds.
- **One open at a time.** The round of 12/03 is open. Opening the extra night is refused until the round is
  finished. Then the extra night is opened and finished.
- **It scores.** Both nights have a pot of R$ 300,00. Each winner has 114,00 points, and the standings show them
  both in 1st place. The statistics count two nights and a total pot of R$ 600,00. The season still shows one
  round played.
- **The numbers.** The season's finished nights are a round, an extra night and a round. "Resultados" titles
  them "Liga 1", "Liga" marked "Extra", and "Liga 2".
- **Moving.** A round moves onto a day that has only an extra night. An extra night moves onto a day that has a
  round. A round still cannot move onto the day of another round.
- **The planner.** An extra night is on Friday 22/01/2027, a regular Friday. The planner still offers 22/01, and
  the season's rhythm does not start from it.

Editing a night:

- **A scheduled night.** Maria, a results keeper, changes the 12/03/2027 night to another place and writes "Noite
  de pizza". The night's page shows both; the date is still 12/03/2027 at 21:30. The audit log shows the old and
  new place.
- **Only what was changed.** Maria changes only the description: the place stays. She then removes the place: the
  night shows "Local a definir" and keeps its description.
- **Already played.** Maria tries to change the place of an open night, and of a finished one. Both are refused.
  An admin changes it: the pot (300,00) and the winner's 114,00 points are unchanged.
- **A cancelled night.** Nobody can edit it, not even an admin.
- **A description from an older site.** A night's description is stored as `<p>&nbsp;Liga - 06/26</p>` followed
  by an empty paragraph. Its page and the edit form show "Liga - 06/26".

The partial result, on the open night of 14/03:

- **Filling in.** Ana, an active player, saves the pot R$ 840,00 and Breno in 6th place. The night's page shows
  them and "Salvo por Ana". With 5% for the 6th place, it also shows 42,00 points beside it.
- **Last save wins.** Carla opens the form, adds Dudu in 5th place and saves. The page shows the pot 840,00, 5th
  Dudu, 6th Breno and "Salvo por Carla".
- **Same player twice.** Carla puts Dudu in 4th place too. Saving is refused: "Este jogador já está na 4ª posição.",
  on the 5th place.
- **A position that does not score.** A 7th place is refused in a season with 6 scoring positions.
- **Not open.** Ana tries on a scheduled night, or after the night is finished. It is refused: "O resultado parcial
  só pode ser preenchido enquanto o evento está aberto."
- **Not an active player.** Élio is inactive. He sees the partial result but cannot save it.
- **Finishing.** Maria, a results keeper, taps "Finalizar". The pot and the 5th and 6th places are already filled,
  under "Preenchido com o resultado parcial salvo por Carla". She fills the rest and finishes. The partial result
  is gone.

Suggested dates, for a season whose regular night is Friday at 21:30:

- **Created on Monday.** Today is Monday 24/03/2025. Suggestions: **28/03** (chosen), 04/04 and 11/04, all at
  21:30.
- **Created on the day.** Today is Friday 28/03. Suggestions: **28/03**, 04/04 and 11/04.
- **This week's Friday has passed.** Today is Saturday 29/03. Suggestions: **04/04**, 11/04 and 18/04.
- **This week's night already exists.** Today is Monday 24/03 and 28/03 already has a night. Suggestions:
  **04/04**, 11/04 and 18/04.
- **A new season.** The season starts on Tuesday 01/04/2025 and today is 20/03. Suggestions: **04/04**, 11/04 and
  18/04.

## Changes already agreed

- A season has its own addresses, and the address alone says which season a season screen shows (rules 3a to
  3e). Before, the picked season was kept in the browser tab and every season shared one address.
- Any active player can be entered in results; there are no rosters (see [players.md](players.md)).
- Results keepers can run nights, not only admins (see [accounts-and-roles.md](accounts-and-roles.md)).
- The **Main Event** is a night of its own type, on a site that turns it on ([main-event.md](main-event.md)).
  The **Main Event pot** is recorded on every night.
- A night can be **extra**, outside the season's calendar (rules 25 to 30).
- The **time chip** is recorded on every night.
- A season records its **money settings** (rules 5b to 5f). The **night dashboard** works a night's money out
  from them, on a site that turns it on ([night-dashboard.md](night-dashboard.md)).
- Attendance answers ("ALL IN" / "FOLD") are described in [attendance.md](attendance.md).

## Open questions

- **Time chip total.** Should the season show the time chips added up (the year party fund)?
- **Using the money settings for the points.** The night dashboard works out the pot and the time chip, and the
  keeper still confirms them at "Finalizar". Should the points come from the dashboard's pot with no typing?
- **Deleting nights.** Archiving, like players, could replace hiding deleted nights.
