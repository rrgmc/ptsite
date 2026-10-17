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
   page. The open night's page leads to it, with "Abrir o painel"; the open night's banner does not. On a finished
   night only an admin gets that link, in "Ações".
2a. **The dashboard is split into tabs**, under its title, and opens on the first:
    - **"Resumo"** (summary): the night at a glance. It has the amounts (rules 11, 11a and 11b), the Main Event
      pot in use, and "Pagamentos" (rule 2b). A finished night also shows the amounts it was finished with.
    - **"Jogadores (n)"**: the participants, with the search for a player who is not on the night (rule 5a).
    - **"Valores"**, on an open night only: the amounts set by hand (rule 13a) and the positions (rule 13). A
      finished night has its result on the night's page instead.
    Moving to another tab keeps what was typed in the one left, such as a search or an amount not saved yet.
2b. **"Pagamentos" counts the payments**, each as how many were paid out of how many, and how many are missing:
    the participants with everything paid, the buy-ins, the rebuys (once the night has one) and the late
    players' time chips (on a site with the time chip, once a player is late). A rebuy's time chip goes with the
    rebuy and is not counted apart.
2c. **A finished night's page shows what its dashboard recorded**: beside the result, its participants and
    their marks, which nobody changes there ("Jogadores"). Under the pot, the result says how many **rebuys** the
    night had and, on a site with the time chip, how many players **arrived late** ("Time chips (atrasos)"); the
    time chip a rebuy pays is not counted. On a phone the participants come under the result.
3. **It refreshes by itself** every few seconds, so several people can use it at once. A change is saved at the
   tap, with no "Salvar".
4. **A participant** is a player the dashboard has a record of, or, while the night is open, a player who answered
   ALL IN ([attendance.md](attendance.md)). Each participant owes one **buy-in**.
5. **Acting on a player makes them a participant.** While the night is open it also answers ALL IN for them,
   whatever their answer was. So does "ALL IN", beside a player found by the search, which does nothing else.
5a. **A player who is not on the night is found by a search** ("Adicionar jogador"), at the top of the
   participants, by nickname or name. The dashboard lists none of them until someone searches, since a league may have more than a hundred players,
   and then shows eight at most. Each one found has "ALL IN" and "Buy-in pago". An inactive player is found
   too, and marked. **The dashboard creates no player**: a first-timer is added in the site first, by whoever
   may ([players.md](players.md)).
5b. The participants' marks are small, so that a player's row fits a phone.
6. **Whoever changes the dashboard can answer for any player** on the open night, also on the night's page. On a
   site without the dashboard only results keepers and admins can (rule 4 of [attendance.md](attendance.md)).
7. Each participant has:
   - **"Buy-in"**: whether the buy-in was paid;
   - **rebuys**: one record for each, each with its own paid mark;
   - **"Time chip"**, on a site with the time chip: whether the player arrived late and owes one, and whether it
     was paid. Marking it as paid also marks it as owed. Unmarking it as owed also unmarks it as paid.
7a. **A paid buy-in and a paid rebuy each say how they were paid**: in cash, or not in cash (a bank transfer, for
   instance). A tap on the mark goes from not paid to paid in cash, then to paid not in cash, then back to not
   paid. Marking a payment as not in cash also marks it as paid. Unmarking it as paid also clears "not in cash".
   A line under the participants says what the two signs mean. The time chip has no such mark of its own: a
   late player's time chip counts as paid the way their buy-in was, and a rebuy's time chip the way the rebuy
   was.
7b. **Each participant's row shows when they answered ALL IN** ("Confirmou 14/03 às 18:40"), in small faded letters
   under the name: the date and time of their first ALL IN on that night. Answering ALL IN again keeps that
   time, also after a FOLD or a removed answer ([attendance.md](attendance.md), rule 3). A participant with no ALL IN answer, such as one an admin added to a finished night, shows none. A league may
   charge a player who confirms late, on the night's own day for instance; the site charges nothing and only
   shows the time.
8. **The prices are the season's money settings** (rules 5b to 5f of
   [seasons-and-nights.md](seasons-and-nights.md)). A price the season does not have counts as zero.
9. **A night has at most one house owner** ("Dono da casa"), picked on the dashboard. Picking one makes them a
   participant. On a site with the house owner's buy-in, they owe the season's house owner's buy-in instead of
   the buy-in. Their rebuys cost the same as anyone's.
9a. **The pot for points counts the house owner's full buy-in.** The owner pays less, but the others play for
   the same pot as if the owner had paid the buy-in. The difference is the **house owner's discount**
   ("Desconto do dono da casa"): the buy-in less the house owner's buy-in. A night with no house owner, or a site
   without the house owner's buy-in, has none.
10. **Rebuys follow the season.** A season with no rebuys takes none. At the season's limit a player takes
    another only when the season allows rebuys past the limit. No player has more than 50. A rebuy past the limit
    costs the same and goes to the pot like any other; what it changes is that its player scores no points on
    that night (rule 5b of [seasons-and-nights.md](seasons-and-nights.md)). The site does not enforce that: the
    keeper leaves that player out of the positions.
11. **The amounts.** The summary shows the pot and the time chip in two tiles, one amount each. Below them,
    **"Dinheiro"** (money) adds the money up: "Pote total", "Desconto do dono da casa" when there is one,
    "Time chip total" and the total. Then it shows what was paid and what is pending of the pot and of the time
    chip, and **"Total que falta"** (total pending):
    - **"Pote"**: the pot for points: the buy-ins, the house owner's counted in full (rule 9a), and every rebuy,
      also the ones past the limit. Its paid and pending are money, so what is owed is the pot less the house
      owner's discount;
    - **"Time chip"**, on a site with the time chip: one time chip value for each late player and, when the
      season says a rebuy also pays the time chip, one for each rebuy. A rebuy's time chip is paid with the rebuy;
    - **"Total com time chip"** (total with the time chip): the money of the two added up: the pot less the
      house owner's discount, and the time chip. On a site without the time chip it is called **"Total"**.
    The time chip is never mixed into the pot.
11b. **"Premiação"** (payout), under "Dinheiro": the money paid out to the players. It is the total
    without the time chip, less the Main Event pot: the pot in use less the house owner's discount, less the Main
    Event pot in use (rule 14). On a finished night, the Main Event pot is the one the night was finished with.
    A season with no Main Event pot pays out all of that money. It changes neither the night's result nor its
    points.
11a. **What was paid is split by how**, so that the money in hand can be checked:
    - **"Fora do dinheiro"** (not in cash): each buy-in paid not in cash, with the time chip that player paid;
      each rebuy paid not in cash, with the time chip it pays; and the adjustment of rule 13c, when there is one;
    - **"Em dinheiro"** (in cash): the total paid, less what was not in cash.
    The summary shows both under the payout, once anything is not in cash. A player's row says
    how much that player paid not in cash, beside what they have pending. Neither changes the pot, the time
    chip, what is pending or the night's result.
12. **A participant with a mark or a rebuy cannot leave the night**: FOLD, removing the answer and "Remover do
    evento" are refused until the marks and rebuys are removed. A participant with none can be removed, which
    also removes their answer.
13. **The dashboard holds the partial result** of an open night (rules 18 to 24 of
    [seasons-and-nights.md](seasons-and-nights.md)). Each position is saved by itself when picked, so two people
    filling different positions do not undo each other.
13a. **"Valores" shows the night's amounts, each in a field with a mark "Manual" beside it**: the pot, the time
    chip (on a site with it) and the Main Event pot (on a site with it). **While an amount is not marked, its
    field is closed and shows the amount worked out.** Marking it opens the field, which starts from that
    amount: the amount typed there stands in for the one worked out, for a night that does not record every
    player's payments. Unmarking a saved amount goes back to the one worked out. **Nothing changes at the tap on
    a mark**, so that a tap by mistake costs nothing: one "Salvar" saves every amount typed and every amount
    unmarked. Until then an unmarked field only closes, with its saved amount still in it. When someone else
    saves an amount meanwhile, the fields that were not touched show it, and the ones that were marked, unmarked
    or typed in stay as they were left.
13b. An amount set by hand is used in the summary, for the points shown beside the positions, for the
    Main Event pot's share and at "Finalizar". A pot set by hand stands in for the pot for points. The amount worked out stays in sight beside it in
    "Dinheiro" ("Calculado"). What was paid and what is pending still come from the players.
13c. **"Valores" also has "Ajuste fora do dinheiro"**, for anything out of the ordinary: an amount that is added
    to what was paid not in cash. Its mark, "Ajustar o valor fora do dinheiro", comes first, and its field shows
    only while the mark is ticked. The amount may be negative, which takes it from what was not in cash; a line
    below the field says so. Unmarking it takes the adjustment away. Both are saved by the same "Salvar". It is
    kept when the night is finished.
14. **The Main Event pot worked out is the season's share of the money**: the **Main Event pot share** ("Pote ME: %
    do pote", from 0 to 100) of the pot in use less the house owner's discount, rounded to a whole unit. A season with no share has an empty
    Main Event pot until it is marked "Manual" and typed, or entered at "Finalizar".
14a. **The dashboard does not finish a night.** What it holds is what the players recorded; a results keeper or
    an admin makes it the night's result with "Finalizar", on the night's page.
15. **"Finalizar" starts filled from the dashboard**: the pot and the time chip (the ones set by hand, or else
    the pot for points and the time chip owed), the Main Event pot and the positions. The keeper changes what is needed and
    finishes as usual. The form says how much is still pending.
16. **Finishing fixes the night's money.** Every player who answered ALL IN becomes a recorded participant, and
    the season's prices are copied to the night: changing the season's money settings later does not change a
    finished night.
16a. **Undoing the opening of a night deletes its dashboard**
    ([seasons-and-nights.md](seasons-and-nights.md), rule 8a): the participants, their payments, the rebuys, the
    house owner and the positions. The night is scheduled again and has no dashboard. The ALL IN answers stay,
    also the ones the dashboard gave (rule 5), so those players are participants again if the night is opened
    again, with nothing paid. The audit log keeps what was deleted.
17. **The night's result is what the keeper finished it with.** Changes to the dashboard of a finished night
    never change the night's pot, time chip or points. When the calculated amounts differ from the recorded
    ones, the dashboard shows both.
18. **What is recorded in the audit log:** every change to the dashboard of a finished night, with how each
    payment was made, the change of the house owner, and an answer given for someone else. The taps on an open night are not: each record keeps who
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

  Élio owes R$ 25,00 of buy-in. Breno owes R$ 215,00 in all and has R$ 55,00 pending. The pot for points is
  R$ 450,00: the R$ 425,00 owed and the house owner's discount of R$ 25,00, shown under the pot.
- **The payments.** On that night "Pagamentos" says: participants with everything paid, 2 of 5 (Ana and Élio),
  3 missing; buy-ins, 3 of 5, 2 missing; rebuys, 3 of 4, 1 missing (Breno's third); time chips, 1 of 1 (Carla's).
- **The payout.** With a Main Event pot share of 20%, the Main Event pot is R$ 85,00 (rule 14). The payout is
  R$ 340,00: the total of R$ 450,00 less the time chip of R$ 25,00 and the Main Event pot of R$ 85,00. With a
  Main Event pot of R$ 90,00 set by hand, it is R$ 335,00.
- **Not in cash.** On that night Ana paid her rebuy by bank transfer, and Breno his buy-in. Ana's rebuy is
  R$ 55,00, with the time chip it pays, and Breno's buy-in R$ 50,00: of the R$ 295,00 paid, R$ 105,00 are not in
  cash and R$ 190,00 are in cash. The pot and the time chip are the same.
- **The time chip goes with the buy-in.** Carla pays her buy-in and her time chip by bank transfer: one tap more
  on "Buy-in" says so, and R$ 55,00 are not in cash. Had she paid the buy-in in cash, her time chip would count
  as cash too.
- **An adjustment.** Breno alone marked his buy-in as not in cash: R$ 50,00 not in cash and R$ 245,00 in cash.
  Ana ticks "Usar" beside "Ajuste fora do dinheiro", types -5,00 and saves: R$ 45,00 not in cash and R$ 250,00
  in cash. With 20,00 instead: R$ 70,00 and R$ 225,00.
- **A site without the house owner's buy-in.** The same night: Élio owes R$ 50,00, the pot owed is R$ 450,00, and
  there is no discount. The pot for points is the same R$ 450,00.
- **A site without the time chip.** The same night has no time chip: the total is the pot.
- **A rebuy that does not pay the time chip.** With that setting off, the time chip owed is Carla's R$ 5,00.
- **A season with no prices.** Every amount is R$ 0,00.
- **The Main Event pot.** With a share of 20%, the money of R$ 425,00 (the pot of R$ 450,00 less the discount)
  gives R$ 85,00, shown in a closed field. With
  15% it gives R$ 64,00, from R$ 63,75. A season with no share gives none. Ana marks its "Manual" and saves
  R$ 90,00: the dashboard and "Finalizar" use R$ 90,00. She unmarks it and saves: R$ 85,00 again.
- **Set by hand.** On another night nobody marks the rebuys. The pot's field is closed and shows R$ 450,00. Ana
  marks its "Manual", types R$ 600,00 over it and taps "Salvar", leaving the time chip unmarked. The summary shows
  the pot R$ 600,00 with "Calculado R$ 450,00" beside it, the time chip R$ 25,00 and the total R$ 600,00, without the discount. The
  Main Event pot is R$ 115,00, the 20% of the typed pot less the discount. "Finalizar" starts with R$ 600,00.
- **No new player here.** Ana searches for "Estreante", who never played: nobody is found. A results keeper adds
  the player in the site, and the search then finds them.

Rebuys:

- **No rebuys.** A season with 0 rebuys allowed and none past the limit refuses a rebuy ("Esta temporada não tem
  rebuys.").
- **At the limit.** A season allows 2 rebuys and none past the limit. Breno has 2: a third is refused ("O limite é
  de 2 rebuys por jogador."). With rebuys past the limit it is accepted.
- **Two phones.** Ana and Carla both tap "+ Rebuy" for Breno, who has 1. Breno ends with 2, not 3: the second
  tap asked for a second rebuy, which he already had.

Participants, on the open night of 14/03:

- **Acting confirms.** Dudu did not answer. Ana types "du" in "Adicionar jogador", finds Dudu and taps "Buy-in
  pago": Dudu is on the dashboard with his buy-in paid, and listed under "Vão jogar" with the answer set by Ana.
- **When each confirmed.** Carla answered ALL IN on 12/03 at 18:40 and again on 13/03. On 13/03 she also
  changed to FOLD, removed the answer and answered ALL IN once more. Dudu was confirmed by Ana's tap on 14/03 at
  22:10. Their rows say "Confirmou 12/03 às 18:40" and "Confirmou 14/03 às 22:10".
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

Undoing the opening:

- **The wrong night.** The night of the examples was opened by mistake. Helena, an admin, undoes its opening: the
  five participants, the four rebuys, Élio as the house owner and the positions are deleted, and the night is
  scheduled again. The five keep their ALL IN.

Finishing:

- **Filled.** Maria, a results keeper, goes back to the night's page and taps "Finalizar". The form has the pot R$ 450,00, the
  Main Event pot R$ 85,00, the time chip R$ 25,00 and the positions, and says R$ 155,00 is pending. She finishes.
- **Fixed.** An admin then changes the season's buy-in to R$ 60,00. The finished night's dashboard still charges
  R$ 50,00.
- **Added afterwards.** An admin adds Fausto, who never answered, to the finished night: his row shows no
  confirmation time.
- **After the night.** Breno pays his third rebuy the next day. Élio, an active player, cannot mark it; an admin
  does. The night's pot and points do not change, and the audit log records the change.

## Open questions

- **Statistics.** Should the site show each player's rebuys and what each night collected?
