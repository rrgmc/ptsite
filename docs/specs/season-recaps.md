# Season recaps

Status: **Draft** for designer review

## Goal

After each night, a short and fun text tells how the season is going: who won, who climbed, who fell, and what
is still open. The players read it on the site. An assistant usually writes it, from the numbers the site gives,
through a writer account ([accounts-and-roles.md](accounts-and-roles.md), rule 13).

## Who

Writers and admins write recaps. Everyone reads the published ones.

## Feature flag

Recaps are the feature `seasonRecaps`, **off** unless the site turns it on in its `site.json`.

- With it off, the site shows no recap and the API refuses to create or publish one ("Este site não publica
  crônicas. Salve como rascunho."). A writer can still keep drafts, read the digest and write memos.
- The writer role, the digest and the reading of recaps are there either way.

## Rules

1. **A recap belongs to a season.** Its text ("texto") is plain: line breaks are kept and nothing else is
   formatted. It has at most 4000 characters.
2. **A recap may be about one night**: a finished night of the same season. A night has at most one recap. A
   recap about no single night (a season opening, a mid-season summary) is allowed.
3. **A recap is published or a draft.** A new recap is published unless the writer asks for a draft. A draft
   is seen only by writers and admins. Publishing a draft dates it; making a published recap a draft again
   hides it.
4. **The season's standings screen shows the newest recap** in a card "Crônica da temporada", below the table,
   with its night's date. "Crônicas anteriores" opens the older ones, newest first. Writers and admins also see
   the drafts there, marked "Rascunho".
5. **Writers and admins change and delete recaps.** The audit log records every change, and keeps a deleted
   recap's text.

## Digest

The digest is one read with what a recap needs (`GET /api/v1/seasons/{season}/digest`):

- the season: its rounds, the rounds played, the rounds left and the extra nights played;
- the latest finished night that gives points, with its pot and results, and the next night;
- the standings, where each line also has:
  - the rank before the latest night (none if the player had not scored yet);
  - the points the latest night gave;
  - the gap to the leader and to the line above;
  - the player's position on each of the latest five nights, oldest first, with none where the player did not
    score ("form");
- the three newest published recaps, so the next one can follow on from them.

A season known only by its final standings ([season-totals.md](season-totals.md)) has its final lines in the
standings, before and after: they never move.

## Examples

Names are invented. The players are Ana, Breno and Carla.

- **The standings move.** Night 1: Ana wins R$ 100, Breno second with R$ 60. Night 2: Breno wins R$ 120, Carla
  second with R$ 50, Ana does not score. In the digest Breno leads with R$ 180, up from 2nd. Ana is 2nd with
  R$ 100, down from 1st, R$ 80 behind the leader. Carla is 3rd, R$ 130 behind the leader and R$ 50 behind Ana,
  with no rank before. Ana's form is 1st, then none; Carla's is none, then 2nd.
- **A recap after night 2.** The writer publishes "Breno virou o jogo!" about night 2. The season's screen shows
  it with the date of night 2.
- **One per night.** The writer sends a second recap about night 2. The site refuses: "Este evento já tem uma
  crônica."
- **A draft.** The writer saves a recap as a draft. Players do not see it; an admin does, and publishes it.
- **Without the feature.** On a site without `seasonRecaps`, creating a recap answers "not found", and
  publishing a draft is refused: "Este site não publica crônicas. Salve como rascunho." The season's screen
  shows no card.
