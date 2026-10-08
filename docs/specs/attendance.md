# Attendance ("ALL IN" / "FOLD")

Status: Agreed.

## Goal

Know who is coming to the night that is open, so the host can plan, and make entering the results quicker.

## Who

- **Players** answer for themselves.
- **Results keepers** and **admins** can answer for any player, for example for someone who told them in person.
- On a site with the [night dashboard](night-dashboard.md), so can every **active player**.
- Everyone can see the answers.

## Rules

1. For each night, a player answers **"ALL IN"** (coming) or **"FOLD"** (not coming). A player can change the
   answer, or remove it ("Não confirmado").
2. Answers open **when the night is opened** and close **when it is finished**. Only an open night takes
   answers; scheduled, finished and archived nights do not. This holds for everyone: a results keeper or an admin
   cannot answer for a player on a scheduled night either.
2a. A scheduled night says "As confirmações começam quando o evento for aberto." Answers given to a scheduled
   night before this rule existed are kept and listed; they can be changed once the night is open.
3. A player has **one answer per night**. A different answer replaces the previous one and takes the new answer
   time. Repeating the same answer changes nothing, so nobody loses their place in the list.
4. Results keepers and admins can set or remove the answer of any player who is not archived. The answer records
   who set it, and the change goes to the audit log. A player's own answers are not audited.
4a. On a site with the night dashboard, whoever changes the dashboard of the open night answers for any player
   too: active players, results keepers and admins. These answers record who set them and go to the audit log
   in the same way.
4b. On such a site, a player with a payment or a rebuy recorded on the dashboard **cannot answer FOLD or remove
   the answer** until those are removed ([night-dashboard.md](night-dashboard.md), rule 12).
5. An account that is not linked to a player (an admin who does not play) cannot answer for itself.
6. The night's page lists **who is coming**, numbered in the order they answered, and **who folded**. Players
   without an answer are not listed.
7. When finishing a night, the player picker lists the players who answered **ALL IN first**, under
   "Confirmados", then the other active and inactive players as usual.
8. While a night of the **current season** is open, a banner at the top of "Classificação" and "Resultados"
   names it. A player who has not answered gets the buttons **"ALL IN"** and **"FOLD"** there. A player who has
   answered sees the answer ("Você: ALL IN") and "Alterar", which leads to the night's page; the answer is
   changed or removed there. The banner is about the current season's night also while another season is on
   screen. An account with no player sees no banner.

## Examples

Names are invented.

- **Not open yet.** The night of Friday 28/03 is scheduled on Monday 24/03. Ana tries to answer ALL IN that
  Monday: it is refused ("As confirmações começam quando o evento for aberto."). So is Maria, a results keeper,
  answering for Dudu. Nobody is listed.
- **Answering.** The night is opened. Ana answers ALL IN at 10:00, Breno answers ALL IN at 11:00 and Carla
  answers FOLD. The night's page shows "Vão jogar (2): 1. Ana, 2. Breno" and "Fold (1): Carla".
- **Banner.** Before answering, Ana opens "Classificação". The banner says "Evento aberto: Sexta-feira, 28/03"
  and "Confirme sua presença", with the buttons ALL IN and FOLD. She taps ALL IN: the banner now says
  "Você: ALL IN" with "Alterar", and "Resultados" shows the same. Helena, an admin with no player, sees no banner.
- **Changing.** Later Ana changes to FOLD. Now "Vão jogar (1): 1. Breno" and "Fold (2)", with Ana after
  Carla because her answer is newer.
- **Repeating.** Breno taps ALL IN again. Nothing changes: he stays 1st.
- **Removing.** Carla removes her answer. She is no longer listed.
- **For someone else.** Dudu tells the host he is coming. Maria, a results keeper, answers ALL IN for him. The
  answer shows that Maria set it, and the audit log records it.
- **With the night dashboard.** Ana, an active player, answers ALL IN for Dudu, who told her he is coming. Dudu
  pays his buy-in, which Ana marks on the dashboard. Dudu then tries FOLD: refused ("Remova os pagamentos e os
  rebuys do jogador antes.").
- **Closed.** After the night is finished, nobody can answer; the lists stay as they were.
- **At the table.** When Maria finishes the night, the picker for each position lists Breno and Dudu first,
  under "Confirmados".

## Open questions

- Should players get a reminder (for example a phone notification) when a night is scheduled?
