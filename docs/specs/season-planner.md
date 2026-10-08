# Season planner ("Planejar datas") and holidays ("Feriados")

Status: Agreed.

## Goal

At the start of a season, usually once a year, the admins look at the year's holidays and choose the Fridays
the league will play. The planner does this in one screen: it lists the regular nights of the season, leaves
out the ones that fall on a holiday, on the day after a holiday ("emenda") or on the Carnival weekend, and
schedules the chosen dates at once.

Scheduling one night at a time, with the next three regular weekdays as suggestions, stays as it is (rules 14
and 15 of [seasons-and-nights.md](seasons-and-nights.md)).

A site can do without the planner (`features` in [`site/README.md`](../../site/README.md)). It then has no
"Planejar datas", and its nights are scheduled one at a time. The holiday table stays: the season calendar uses
it.

## Who

- **Admins** plan the season and edit the holidays.
- Everyone logged in can see the holidays.

## Rules

### The holiday table

1. The site keeps a **holiday table**. Each holiday has a name, a scope (national, São Paulo state or São Paulo
   city) and a rule for its date: either the **same day every year** (Tiradentes, 21/04) or a number of days
   **before or after Easter Sunday** (Sexta-feira Santa, 2 days before; Corpus Christi, 60 days after).
2. A holiday can be limited to a range of years. Consciência Negra (20/11) is national from 2024; before that it
   was a São Paulo city holiday.
3. The table of a new database starts from a **preset** named in `PTSITE_HOLIDAY_PRESET`
   (`backend/config/ptsite.php`). The built-in preset `sao-paulo` holds Brazil's national holidays and those of the
   city and state of São Paulo, plus **Véspera de Natal (24/12)** and **Véspera de Ano Novo (31/12)**: not
   official holidays, but a league may not play on them. An empty setting starts an empty table. The examples
   below use the `sao-paulo` preset. Admins can add holidays, change them, and archive the ones that no longer
   apply. Archiving asks for confirmation first. An archived holiday no longer counts, but it stays in the table
   for admins, marked "arquivado", and can be restored.
4. **Changes for one year.** For a given year, an admin can say a table holiday **will not happen** ("Não
   haverá") or add an **extra holiday** for that year only. Moving a holiday is both: cancel it and add the new
   date. Each change can be undone.

### Planning

5. The admin chooses the **start and end dates** of the plan (at most about 18 months). **The calendar opens on
   the whole season**: the start defaults to the season's start date, and the months before today show the
   rounds the season already has. Until the admin types a start date, **no date before today is suggested**: new
   dates start today, or at the season start if later. Until the admin types an end date, **the plan stops at the night that completes
   the season's rounds** (the rounds minus the nights it already has), so an empty season gets exactly its 26
   nights around the holidays. When no rounds are left, the end defaults to 31/12.
6. The planner walks the season's **regular weekday** **every N weeks** (the season's frequency, from 1 to 4; 2
   by default). **It carries on the season's rhythm:** when the season
   already has a night before the start date, the walk continues N weeks after the week of the last one (moved
   forward N weeks at a time until it reaches the start date). Otherwise it starts at the first regular weekday on
   or after the start date.
7. A date is **left out** when:
   - it is a holiday (**"Feriado"**);
   - the day before is a holiday (**"Emenda"**, a long weekend: Corpus Christi on a Thursday makes the Friday
     one);
   - it falls in the four days before Carnival Tuesday (**"Carnaval"**), while Carnival is a holiday that year.
8. A night that is left out **moves one week later**, and the cadence carries on from the new date.
9. **Every round the season already has in the range** is shown as **"Já agendado"**, on whatever day it is (a
   Thursday, or a Friday off the usual weeks), with a link to it. **A week that already has a round does not get
   another**, and the cadence carries on N weeks after that night's week. An **extra night** is outside the
   calendar ([seasons-and-nights.md](seasons-and-nights.md), rule 25): the planner does not show it, and its week
   and its day stay free.
10. **Everything is only a suggestion.** The admin can tick any date that was left out, untick any other, and tap
    any other day to add a night on it at the regular time.
11. **Rounds.** A season has a number of rounds ("Rodadas", usually 26). The planner shows "Rodadas: N de 26":
    the season's rounds (its nights that are not extra) plus the ticked dates. Going past the rounds shows a warning, but scheduling is still
    allowed (for example a replacement night).
12. Confirming ("Agendar N eventos") schedules **all the ticked dates at once**, at the season's default place, or
    none of them if one is refused (for example a date that already has a round). Each night is recorded in the
    audit log like a night scheduled on its own.

## Examples

2027, with the `sao-paulo` preset. Easter is on 28/03, so Carnival Tuesday is 09/02, Sexta-feira Santa is
26/03 and Corpus Christi is Thursday 27/05. The regular night is Friday at 21:30, every 2 weeks.

- **The first half of 2027.** Planning from 04/01 to 30/06 gives 08/01, 22/01, 12/02, 26/02, 12/03, 02/04,
  16/04, 30/04, 14/05, 04/06 and 18/06. Left out: **05/02** (Carnaval), **26/03** (Feriado: Sexta-feira Santa)
  and **28/05** (Emenda: Corpus Christi).
- **A skipped night moves one week.** From 12/03: 26/03 is Sexta-feira Santa, so the night moves to 02/04, and
  the next ones are 16/04 and 30/04.
- **A holiday cancelled for the year.** An admin says Corpus Christi will not happen in 2027. Planning from 14/05
  gives 14/05, **28/05** and 11/06.
- **An extra holiday.** With Corpus Christi cancelled, an admin adds "Jogo do Brasil" on 11/06/2027. Planning
  from 14/05 gives 14/05, 28/05, **11/06 left out** (Feriado: Jogo do Brasil) and 18/06.
- **Carnival cancelled.** If Carnival is cancelled for 2027, 05/02 is planned.
- **Every week.** With a weekly season, from 12/03: 12/03, 19/03, 26/03 left out, 02/04.
- **Already scheduled.** The season already has a night on 08/01. Planning from 04/01 shows 08/01 as "Já
  agendado" and continues with 22/01.
- **Carrying on the rhythm.** The season's last night was 12/02. Planning from 01/03 to 10/04 gives **12/03**
  (26/02 was the next, then 12/03), 26/03 left out (Sexta-feira Santa) and 02/04.
- **A Thursday night.** The season already has a night on Thursday 20/05. Planning from 03/05 to 20/06 gives 07/05,
  20/05 (Já agendado), 04/06 and 18/06: no night on Friday 21/05.
- **A Friday off the usual weeks.** The season already has a night on 14/05. Planning from 03/05 to 20/06 gives
  07/05, 14/05 (Já agendado), 28/05 left out (Emenda: Corpus Christi), 04/06 and 18/06.
- **A whole empty season.** A season of 26 rounds with no nights, planned from 04/01/2027 without an end date:
  26 nights, from 08/01/2027 to **21/01/2028**, with 05/02 (Carnaval), 26/03 (Sexta-feira Santa), 28/05 (Emenda:
  Corpus Christi) and 31/12 (Véspera de Ano Novo) left out. With 3 rounds left: 08/01, 22/01 and 12/02 (05/02 is left out).
- **Christmas and New Year's Eve.** With a weekly season in December 2027: 17/12, then 24/12 (Feriado: Véspera
  de Natal) and 31/12 (Feriado: Véspera de Ano Novo) left out, and 07/01/2028.
- **Past the rounds.** The season already has 20 nights of 26 and 11 dates are ticked: "Rodadas: 31 de 26", with a
  warning. The 11 nights can still be scheduled.
- **Wrong range.** An end date before the start date, or a plan longer than 18 months, is refused.

## Screens

- **Administração → Temporadas**: each season that is not finished has **"Planejar datas"**, and the list shows
  the rounds scheduled ("Eventos") and the ones played ("Finalizados"). The season form has **"Rodadas"** and **"Frequência"** (toda semana, a cada 2, 3 ou 4
  semanas) next to the regular weekday and time.
- **Planejar datas** is a **calendar**: "De" and "Até" fields ("Até" shows the last round, with the hint "Até a
  última rodada (26ª)", or "Fim do ano" when no rounds are left), the "Rodadas" counter and a legend, then one month grid per month. Ticked days are filled; regular
  nights left out are shaded; nights already scheduled are outlined and open the night; **holidays have their own
  color**, so they are easy to see when choosing dates; **today is a square** and its month a slightly different background, as on the
  [season calendar](season-calendar.md) (rule 5a). Under each month, every holiday, every night left out and
  every night already scheduled is listed by date. Tapping a day ticks or unticks it. **"Agendar N eventos"** stays in view on
  a phone.
- **Administração → Feriados**: the holidays of a year (next year first, with ‹ › to change year), each with "Não
  haverá" or "Desfazer"; "Feriado só em AAAA" to add an extra holiday; and the holiday table with "+ Novo
  feriado".

## Open questions

- Other long weekends: a holiday on a Monday (Friday before it), or the Friday after Ash Wednesday. Not skipped
  for now; they can be unticked by hand.
