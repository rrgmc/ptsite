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
3a. **One season on every screen.** The standings, the results, the calendar and the simulator all show the same
   season: the **selected season**. It is the current season unless the user picks another. If no season is
   open, it is the newest season.
3b. **"Temporadas"** lists every season, newest first, with its start date, how many nights were played, and
   whether it is the current one ("Atual"), finished, open or closed. It marks the selected season. Everyone
   logged in can open it, from the season name at the top of every screen or from the menu.
3c. **Picking a season** in that list makes it the selected season on every screen. The pick lasts until the user
   picks another season, closes the browser tab or logs out ("Sair"). It belongs to that browser tab only: it
   changes nothing for other people.
3d. While the selected season is not the current one, the season screens say so ("Você está vendo Liga 2022, que
   não é a temporada atual.") and offer **"Voltar para a atual"**.
3e. A link to one season (`/seasons/7/results`) picks that season, then opens the screen. If the picked season no
   longer exists or was archived, the site goes back to the current season.
4. A night belongs to a season explicitly. A night's season cannot be worked out from its date, because
   seasons no longer follow the calendar year.
5. A season has a **regular night**: a weekday, a start time and a frequency (for example Friday at 21:30, every
   2 weeks). A new season starts with the previous season's regular night; the very first one defaults to Friday
   at 21:00, every 2 weeks. It is only used for suggestions and for the
   [season planner](season-planner.md).
5a. A season has a number of **rounds** ("Rodadas"): how many nights it has, usually 26. A new season starts with the
   previous season's number. It is a target, not a limit: scheduling a night past it shows a warning ("A temporada
   já tem 26 eventos de 26 rodadas") but is allowed.

### Game nights ("Evento")

6. A night has a date and time, a place (the season's default place unless changed) and a description.
6a. A night's title is a word set by the site and the night's date: "Liga - 14/03/2026". The first word is the
   site's setting (`nightTitlePrefix` in its `site.json`); the demo league uses "Liga", and so do the
   examples in these specs. On "Resultados" the title also has the night's number in the season, counting the
   finished nights from the oldest: "Liga 3 - 14/03/2026".
7. A night goes through these states: **scheduled** → **open** → **finished**.
8. **Only one night per season can be open at a time.** Opening a second night is refused until the first is
   finished.
9. **Finishing a night** ("Finalizar") records:
   - the **pot** (required, above zero);
   - the **Main Event pot** ("Pote ME", required, zero allowed): the money set aside that night for the Main Event;
   - the **time chip** (required, zero allowed): the money set aside that night for the year party. A time chip
     is paid with every rebuy, and by a player who arrives late. The keeper enters the night's total;
   - which active or inactive player finished in each **scoring position**.
9a. Only the pot counts for points. The Main Event pot and the time chip are recorded; they are not added up
   anywhere yet.
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
    order). It is saved as finished.
14. **Suggested dates.** A night is usually created early in its week (on the Monday), so when scheduling, the
    site offers the **next three regular weekdays** at the regular time, starting today (or at the season's
    start, if later). The first is chosen at the start. Today counts if it is the regular weekday. Dates that
    already have a night in the season are left out.
15. **Suggestions are only suggestions.** Any date and time can be chosen. These suggestions do not look at
    holidays: the person scheduling picks another date when needed. Planning a whole season, with holidays, is the
    [season planner](season-planner.md).
16. **Remarcar.** A scheduled night can be moved to another date and time by a results keeper or an admin. Any
    attendance answers it has stay, and so does its place. It cannot be moved onto a day that already has another
    night in the season. An open or finished night cannot be moved.
17. **Cancelar.** A scheduled night can be cancelled by a results keeper or an admin, after confirming. It is
    archived, not deleted: it leaves the season's lists and calendar, its date is free again, and the audit log
    keeps it. An open or finished night cannot be cancelled; a finished night's result is corrected instead.
17a. **Editar evento.** A night's **place** and **description** can be changed on a page of their own, whatever
    the night's state. The place can be removed: the night then shows "Local a definir". A results keeper or an
    admin edits a scheduled night; **only an admin** edits an open or finished one. A cancelled night cannot be
    edited. Nothing else changes: the date, the amounts, the result and the standings stay as they are. The change
    is recorded in the audit log.
17b. The night's page shows the description, when it has one. A description is plain text. The ones imported from
    an older site may be HTML from its text editor (`<p>&nbsp;Liga - 07/26</p>`): the site shows only their text,
    and the stored value keeps its markup until someone rewrites the description.

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

## Examples

Names are invented.

- **Opening while another is open.** Night A (14/03) is open. The results keeper tries to open night B (21/03).
  The site says night A must be finished first.
- **Duplicate player.** The results keeper picks Ana for both 1st and 3rd place. Saving is refused and the
  form points at the duplicate.
- **Percentage table.** An admin enters 40, 23, 15, 11, 8, 5 (total 102). Saving is refused, showing "Total:
  102%".

The selected season, in the demo league (the current season, and Liga 2022, which is finished):

- **At first.** A player logs in. Every screen shows the current season, and "Temporadas" marks it "✓ Selecionada"
  and "Atual".
- **Picking another.** The player opens "Temporadas" from the results and picks Liga 2022. The site returns to the
  results, now of 2022. The calendar and the simulator also show 2022, and so does the site after a reload. Each
  of those screens shows the notice; "Jogadores" does not.
- **A finished season.** A results keeper with Liga 2022 selected sees no "+ Agendar". After "Voltar para a
  atual" the notice is gone and "+ Agendar" is back.
- **Logging out.** The player picks Liga 2022, logs out and logs in again: the current season is shown.
- **A link.** Opening `/seasons/10/results` shows the results of Liga 2022 at `/results`.
- **A season that is gone.** Opening `/seasons/999999/results` shows the results of the current season, without
  the notice.

Moving and cancelling:

- **Remarcar.** The night of 12/03/2027 is moved to 19/03/2027 at 20:00. Ana's ALL IN, given before answers were
  limited to open nights, stays; the audit log shows the old and new dates.
- **A day already taken.** 19/03/2027 already has a night: moving the 12/03 night there is refused ("Já existe um
  evento nesta temporada em 19/03/2027.").
- **Already played.** An open or finished night cannot be moved or cancelled.
- **Remarcar keeps the place.** The 12/03/2027 night is at the clubhouse. Moving it to 19/03 leaves it there.
- **Cancelar.** The 12/03/2027 night is cancelled: it leaves the season's nights, and another night can then be
  moved to 12/03.

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

- A picked season stays on every screen (rules 3a to 3e).
- Any active player can be entered in results; there are no rosters (see [players.md](players.md)).
- Results keepers can run nights, not only admins (see [accounts-and-roles.md](accounts-and-roles.md)).
- The **Main Event** is left out for now (see open questions). The **Main Event pot** is recorded on every
  night.
- The **time chip** is recorded on every night.
- Attendance answers ("ALL IN" / "FOLD") are described in [attendance.md](attendance.md).

## Open questions

- **Main Event.** The Main Event itself is not built, yet a Main Event pot is recorded on every night and never
  added up. Should the Main Event come back, and should the pot be added up per season?
- **Time chip total.** Should the season show the time chips added up (the year party fund)?
- **Buy-in.** A season can store a buy-in that no rule uses yet. Keep it?
- **Deleting nights.** Archiving, like players, could replace hiding deleted nights.
