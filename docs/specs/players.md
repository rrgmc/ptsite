# Players

Status: Agreed.

## Goal

Keep one list of the league's players that admins rarely need to touch, and let a new player be added in
seconds, at the table, on a phone.

## Who

- **Admins** manage players in "Administração".
- **Results keepers** and **admins** can quick-add a player while entering results.
- **Players** see other players and edit their own profile, in "Meu perfil".

## Rules

1. There is **one global list of players**. There are no per-season rosters.
2. A player is **active** or **inactive**:
   - **Active** players are the ones currently playing. They appear first when picking players for results.
   - **Inactive** players are not playing for now, for example someone taking a year off. They keep all their
     history and can be made active again at any time.
3. A player can also be **archived**. Archiving is for mistakes, such as a duplicate or a player created by
   accident. Archived players are hidden everywhere except in "Administração", where they can be restored.
   Archiving asks for confirmation first; restoring does not.
4. **Picking a player for results** shows active players first. It can search all players. Inactive players
   are marked as such, so that an old night can be corrected even if a player from it is now inactive.
   Archived players cannot be picked.
5. **Quick add.** On the results form, an admin or results keeper can add a new player by **nickname only**.
   The new player is active. The rest of the details (name, email, birthday, photo, login) are filled in later.
   The "add" option is listed **after** the players that match the search, so a quick tap on the first row
   always picks an existing player.
6. **Nicknames are unique** across all players, including inactive and archived ones.
7. A season's players are **whoever appears in its results**. Standings already list only players who scored.
8. **Lists of players are alphabetical, ignoring capitals and accents.** Nicknames are shown as they were typed,
   in any case. Places and holidays are sorted the same way.

9. **Images.** A player can have a **photo**. The site makes a **thumbnail**, a small photo, from it.
   - The thumbnail is shown next to the nickname in the standings, the results, the players list and the
     players list in "Administração". On a phone, the list in "Administração" leaves it out: with large text
     there is no room for it next to "Editar".
   - A player with no image shows the first letter of the nickname instead, so that the rows line up.
   - In the two players lists, the thumbnail of a player who has a photo opens the photo.
   - Only logged-in users can see the images.
   - **Admins** send or remove any player's photo, on the player's page in "Administração". A **player** sends
     or removes their own, in "Meu perfil". A change takes effect at once, and goes to the audit log.
   - **Only the photo can be sent.** The site cuts the picture from its middle to 3 wide by 4 tall, and makes
     the photo (600 × 800 pixels) and the thumbnail (180 × 240) from it. So the two always show the same
     picture. A picture smaller than the photo is enlarged.
   - A picture straight from a phone's camera works: it can have up to 8 MB and 4096 pixels a side, and at
     least 180 pixels a side. It is a JPEG, PNG or WebP file.
   - **Removing the photo removes the thumbnail too**, and asks first.
   - Images that came from an older site stay as they are until a new photo is sent. A player who has only a
     thumbnail sees it in place of the photo, and can replace or remove it.
10. **"Meu perfil".** A player with a login changes their own **nickname, full name, email and birthday**, and
    their photo, on the page "Meu perfil", reached from the menu.
    - A player cannot change their own status (active, inactive, archived). Only admins can.
    - The nickname must still be unique (rule 6).
    - The email and the birthday are shown only to the player and to admins.
    - The same page changes the account's password
      ([accounts-and-roles.md](accounts-and-roles.md), rule 11).
    - An account with no player, such as an admin who does not play, has only the password there.
11. **The player's page.** Every player has a page of their own, at `/players/<id>`. Everyone logged in can
    open it. A nickname in the standings, the results, a night, the statistics, the simulator and the players
    list links to it.
    - It shows the photo or thumbnail, the nickname, the full name, the memo (rule 12) and the player's
      statistics ([statistics.md](statistics.md), rules 8 to 12).
    - The email and the birthday are shown only to the player and to admins, as in rule 10.
    - An inactive player's page says "Inativo". It shows the same history.
    - An admin sees "Editar", which opens the player in "Administração". The player themself sees "Meu perfil".
12. **Memo.** A player can have a **memo**: a free text of up to 2000 characters, with line breaks, about the
    player.
    - Only **admins** write it, on the player's page in "Administração". A player cannot write their own.
    - Everyone logged in reads it on the player's page and in the detailed view of the players list (rule 13).
      It is not shown anywhere else.
    - It is plain text: the site shows it as typed, and does not turn anything in it into a link or formatting.
    - Saving an empty memo removes it. A change goes to the audit log.
13. **The players list has two views**, chosen with "Lista" and "Detalhado" at the top of the page.
    - **"Lista"** is the view the page opens with. It shows every player: the thumbnail, the nickname and the
      full name.
    - **"Detalhado"** shows only the players who have a memo. Each one has the photo or thumbnail, the nickname
      and the memo.
    - Both views keep the order of rule 8 and mark inactive players. The search works in both.
    - Each view has its own address (`/players` and `/players?view=detailed`), so it can be linked to.

## Examples

Names are invented.

- **Taking a break.** Ana is made inactive in March. In April's results form, Ana appears under "Inativos"
  (inactive) and still appears in last season's standings. In August, Ana is made active again and moves
  back to the top of the list.
- **Correcting an old night.** Breno was inactive when the admin corrected a 2024 night. The picker still
  finds Breno by nickname, marked as inactive, and the correction is saved.
- **A first-timer.** A friend of the host plays for the first time and finishes 3rd. The results keeper types
  "Kiko" in quick add, the player is created as active, and the results are saved. An admin adds the full
  name later.
- **Sorting.** The active players "Zé", "breno", "Élio" and "Carlão" are listed as breno, Carlão, Élio, Zé.
- **Images.** Ana has a thumbnail and a photo, and Breno has neither. The players list shows Ana's thumbnail
  and the letter "B" for Breno. Tapping Ana's thumbnail opens her photo; Breno's letter does nothing.
- **A new photo.** Ana opens "Meu perfil" and sends a picture of 1200 × 1600 pixels from her phone. The site
  stores a photo of 600 × 800 and a thumbnail of 180 × 240. The thumbnail appears next to her nickname in the
  lists at once, and opens the photo. She then removes the photo, confirms, and the lists show the letter "A"
  again.
- **A wide picture.** Ana sends a picture of 1600 × 800 pixels. The photo keeps the middle 600 pixels of its
  width and all of its height.
- **A picture taken upright.** A phone stores Ana's picture lying down, with a note that it must be turned. Her
  photo is upright.
- **Only the old small photo.** Breno has a thumbnail and no photo. "Meu perfil" shows that thumbnail
  with "Trocar" and "Remover". When he sends a picture, both his images are new. If he removes it instead, he has
  no image.
- **Own profile only.** Ana changes her full name and birthday in "Meu perfil". She cannot make herself
  inactive, and she cannot change Breno's name or photo.
- **Wrong file.** Ana picks a text file instead of a picture, or a picture file that is damaged. The site says
  it could not read it, and her photo stays as it was.
- **Memo.** An admin writes "Fundadora da mesa." as Ana's memo. Breno opens Ana's page and reads it. The admin
  then saves an empty memo, and Ana's page no longer has one.
- **Detailed view.** Ana has a memo and Breno has none. The players list opens in "Lista", with both of them and
  no memo. In "Detalhado" it shows Ana with her photo and her memo, and does not show Breno.
- **Not their own memo.** Ana sends a memo for herself, together with a new full name. The site refuses, and
  neither the memo nor the name is saved.
- **Duplicate.** Someone quick-adds "Dudu" although "Dudú" already exists. The admin moves the results to the
  right player (open question below) and archives the duplicate.

## Data imported from an older site

- A site that moves from an older site keeps its own importer. Rosters per season are not part of the model:
  the importer decides which imported players start as active, inactive or archived.
- Images that came with the import stay as they are until a new photo is sent (rule 9). Every memo starts empty.

## Open questions

- Should the player choose which part of the picture is kept, instead of the middle?
- Should there be a way to **merge** two players (move one's results to the other) for duplicates?
- Which other profile fields are kept? For now the memo covers them.
- Should an archived player's page be hidden from players? For now it opens for everyone who has its address,
  because an old night can still name the player.
