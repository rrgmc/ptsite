# Night dashboard ("Painel do evento")

Status: **Draft** for designer review.

## Goal

Run the money of a night from a phone, at the table: who paid the buy-in, who rebought, who owes a time chip, and
who finished where. The site works out the pot and the time chip from it, so nobody adds them up by hand.

A site has the dashboard only if it turns it on (`nightDashboard` in `features`, see
[`site/README.md`](../../site/README.md)). It is off unless the site says otherwise.

## Who

- **Active players**, **results keepers** and **admins** change the dashboard of an open night.
- **Admins** change the dashboard of a finished night.
- **Everyone logged in** sees it.

## Rules

1. **A regular night has a dashboard once it is open**, and keeps it when it is finished. A scheduled night, a
   cancelled night and a Main Event night have none.
2. **The dashboard is a screen of its own**, with no menu, made for a phone. "Voltar ao site" leads to the night's
   page. The night's page and the open night's banner lead to it.
3. **It refreshes by itself** every few seconds, so several people can use it at once. A change is saved at the
   tap, with no "Salvar".
4. **A participant** is a player the dashboard has a record of, or, while the night is open, a player who answered
   ALL IN ([attendance.md](attendance.md)). Each participant owes one **buy-in**.
5. **Acting on a player makes them a participant.** While the night is open it also answers ALL IN for them,
   whatever their answer was. So does "Confirmar", which does nothing else.
6. **Whoever changes the dashboard can answer for any player** on the open night, also on the night's page. On a
   site without the dashboard only results keepers and admins can (rule 4 of [attendance.md](attendance.md)).
7. Each participant has:
   - **"Buy-in"**: whether the buy-in was paid;
   - **rebuys**: one record for each, each with its own paid mark;
   - **"Time chip"**, on a site with the time chip: whether the player arrived late and owes one, and whether it
     was paid. Marking it as paid also marks it as owed. Unmarking it as owed also unmarks it as paid.
8. **The prices are the season's money settings** (rules 5b to 5f of
   [seasons-and-nights.md](seasons-and-nights.md)). A price the season does not have counts as zero.
9. **A night has at most one house owner** ("Dono da casa"), picked on the dashboard. Picking one makes them a
   participant. On a site with the house owner's buy-in, they owe the season's house owner's buy-in instead of
   the buy-in. Their rebuys cost the same as anyone's.
10. **Rebuys follow the season.** A season with no rebuys takes none. At the season's limit a player takes
    another only when the season allows rebuys past the limit. No player has more than 50.
11. **The amounts**, each shown as owed, paid and pending:
    - **"Pote"**: the buy-ins and every rebuy, also the ones past the limit;
    - **"Time chip"**, on a site with the time chip: one time chip value for each late player and, when the
      season says a rebuy also pays the time chip, one for each rebuy. A rebuy's time chip is paid with the rebuy;
    - **"Total"**: the two added up.
    The time chip is never mixed into the pot.
12. **A participant with a mark or a rebuy cannot leave the night**: FOLD, removing the answer and "Remover do
    evento" are refused until the marks and rebuys are removed. A participant with none can be removed, which
    also removes their answer.
13. **The dashboard holds the partial result** of an open night (rules 18 to 24 of
    [seasons-and-nights.md](seasons-and-nights.md)). Each position is saved by itself when picked, so two people
    filling different positions do not undo each other. The pot and the time chip are the calculated ones: the
    partial result keeps none of its own.
14. **The Main Event pot stays a typed amount**, on a site with it. When the season has a **Main Event pot share**
    ("Pote ME: % do pote", from 0 to 100), the dashboard suggests that share of the pot, rounded to a whole unit,
    and one tap takes the suggestion. Any amount can be typed instead.
15. **"Finalizar" starts filled from the dashboard**: the pot and the time chip that are owed, the Main Event pot
    and the positions. The keeper changes what is needed and finishes as usual. The form says how much is still
    pending.
16. **Finishing fixes the night's money.** Every player who answered ALL IN becomes a recorded participant, and
    the season's prices are copied to the night: changing the season's money settings later does not change a
    finished night.
17. **The night's result is what the keeper finished it with.** Changes to the dashboard of a finished night
    never change the night's pot, time chip or points. When the calculated amounts differ from the recorded
    ones, the dashboard shows both.
18. **What is recorded in the audit log:** every change to the dashboard of a finished night, the change of the
    house owner, and an answer given for someone else. The taps on an open night are not: each record keeps who
    changed it last and when.
19. **Without the feature** none of this exists: the night has no dashboard, the partial result keeps its typed
    pot and time chip, and only results keepers and admins answer for others.

## Examples

Names are invented.

The money, in a season with a buy-in of R$ 50,00, a rebuy of R$ 50,00, a time chip of R$ 5,00 that every rebuy
also pays, 2 rebuys allowed and more past the limit, and a house owner's buy-in of R$ 25,00, on a site with the
house owner's buy-in:

- **A night.** Ana, Breno, Carla, Dudu and Élio play, at Élio's house. Ana, Breno and Élio paid the buy-in. Ana
  made 1 rebuy and paid it. Breno made 3: he paid two, and the third, past the limit, is not paid yet. Carla
  arrived late and paid her time chip.

  | | Owed | Paid | Pending |
  |---|---|---|---|
  | Pote | 425,00 | 275,00 | 150,00 |
  | Time chip | 25,00 | 20,00 | 5,00 |
  | Total | 450,00 | 295,00 | 155,00 |

  Élio owes R$ 25,00 of buy-in. Breno owes R$ 215,00 in all and has R$ 55,00 pending.
- **A site without the house owner's buy-in.** The same night: Élio owes R$ 50,00, and the pot owed is R$ 450,00.
- **A site without the time chip.** The same night has no time chip: the total is the pot.
- **A rebuy that does not pay the time chip.** With that setting off, the time chip owed is Carla's R$ 5,00.
- **A season with no prices.** Every amount is R$ 0,00.
- **The Main Event pot.** With a share of 20%, the pot of R$ 425,00 suggests R$ 85,00. With 15% it suggests
  R$ 64,00, from R$ 63,75. A season with no share suggests nothing.

Rebuys:

- **No rebuys.** A season with 0 rebuys allowed and none past the limit refuses a rebuy ("Esta temporada não tem
  rebuys.").
- **At the limit.** A season allows 2 rebuys and none past the limit. Breno has 2: a third is refused ("O limite é
  de 2 rebuys por jogador."). With rebuys past the limit it is accepted.
- **Two phones.** Ana and Carla both tap "+ Rebuy" for Breno, who has 1. Breno ends with 2, not 3: the second
  tap asked for a second rebuy, which he already had.

Participants, on the open night of 14/03:

- **Acting confirms.** Dudu did not answer. Ana marks his buy-in as paid: Dudu is listed under "Vão jogar",
  with the answer set by Ana.
- **Leaving.** Carla answered ALL IN and has no marks. She changes to FOLD: she leaves the dashboard. Dudu, who
  paid, tries the same: refused ("Remova os pagamentos e os rebuys do jogador antes.").
- **The house owner.** Élio did not answer. Ana picks him as the house owner: he is a participant and answered
  ALL IN.
- **Not open yet.** The night of 21/03 is scheduled: it has no dashboard ("O painel começa quando o evento for
  aberto.").
- **A Main Event night** has no dashboard.

Positions:

- **One at a time.** Ana puts Breno in 6th place while Carla puts Dudu in 5th. Both stay.
- **Same player twice.** Carla puts Dudu in 4th place too: refused ("Este jogador já está na 5ª posição.").

Finishing:

- **Filled.** Maria, a results keeper, taps "Finalizar" on the night above. The form has the pot R$ 425,00, the
  time chip R$ 25,00 and the positions, and says R$ 155,00 is pending. She finishes.
- **Fixed.** An admin then changes the season's buy-in to R$ 60,00. The finished night's dashboard still charges
  R$ 50,00.
- **After the night.** Breno pays his third rebuy the next day. Élio, an active player, cannot mark it; an admin
  does. The night's pot and points do not change, and the audit log records the change.

## Open questions

- **Statistics.** Should the site show each player's rebuys and what each night collected?
- **Rebuys past the limit.** They "do not count for the season's points" (rule 5b of
  [seasons-and-nights.md](seasons-and-nights.md)), but the dashboard adds them to the pot. Should the suggested
  pot at "Finalizar" leave them out?
