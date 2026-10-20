# Changelog

All notable changes to the PTSite core are written in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html). A release is a git tag on `master` (see
[RELEASE.md](RELEASE.md)). This file starts at v1.18.1; the GitHub releases list the earlier versions.

## [Unreleased]

### Changed

- "Classificação por temporada" in "Estatísticas" is a small chart per player in place of one chart with ten
  crossing lines: the player's line in their color, over the other players' lines in grey.

## [1.34.0] - 2026-10-20

### Added

- "Classificação por temporada" on the player's page, in "Geral": the player's position in each season, 1st at
  the top, for a player of two seasons or more.
- "Classificação por temporada" in "Estatísticas", in "Geral", below the box with tabs: the same chart for the
  ten players with most points, with a gap where a player did not score.
- Both charts count each season's Main Event as one more night of it, for fun, on the average pot of its nights.
  A season known only by its final standings uses its points over its rounds. The standings never count it
  ([docs/specs/statistics.md](docs/specs/statistics.md), rules 5a and 12).
- `GET /api/v1/statistics` has `rank_progress`, and each season of `GET /api/v1/players/{id}/statistics` has
  `rank_with_main_event`.

### Changed

- The player's page opens on "Geral": every nickname links to `/players/<id>/all`, and "Geral" comes first in
  the switch ([docs/specs/players.md](docs/specs/players.md), rule 11).
- "Pontos acumulados" follows the ten players with most points instead of eight, with two more chart colors
  ([ADR 0023](docs/decisions/0023-ten-chart-colors.md)). The pie of "Locais" keeps eight.

## [1.33.0] - 2026-10-20

### Added

- "Detalhado", in the players list, starts with a button for each player, which scrolls to the player's card.
  Each card shows the full name under the photo.
- `GET /api/v1/players?with_memo=1` lists only the players who have a memo, archived ones too.

### Changed

- "Detalhado" follows "Posições" over every season; the players who are not in it come after, alphabetically.
  It also lists inactive and archived players who have a memo, marked as such
  ([docs/specs/players.md](docs/specs/players.md), rule 13).

## [1.32.1] - 2026-10-20

### Changed

- "Estatísticas" in "Geral": "Campeões das temporadas" and "Campeões do Main Event" are side by side, with one
  line per place holding every player who shares it, on a grid of equal columns. Their places go by the number of
  titles, so a tie does not leave the 3rd place empty.
- The tabs of "Estatísticas" are in the order "Posições", "Campeonatos", "Main Event", "Jogadores", "Eventos"
  and "Rebuys".

## [1.32.0] - 2026-10-20

### Added

- "Resultado final", in "Administração › Temporadas", types the final standings of a season with no night: each
  player's points and times in each position. It shows each position's total against the rounds
  ([docs/specs/season-totals.md](docs/specs/season-totals.md)).
- "Estatísticas" in "Geral" shows the first three of "Campeões das temporadas" and "Campeões do Main Event" by
  titles, with a medal each, above "Pontos acumulados".

### Changed

- A season's final lines may keep a player archived after they were saved, so an imported season can be edited.
- "Títulos" in "Campeonatos" and in "Main Event", in "Estatísticas", lists every player with a title, not only
  the first 10.

## [1.31.1] - 2026-10-20

### Changed

- The worked example of `docs/specs/season-totals.md` and its test name an invented player only.

## [1.31.0] - 2026-10-20

### Added

- A season can be known only by its final standings ("Só totais"): for each player, the total points and how
  often the player finished in each position, with no night. Admins save them with
  `PUT /api/v1/seasons/{season}/totals`. The seasons lists show the badge "Só totais", and "Classificação" and
  "Resultados" say there are no results per night ([docs/specs/season-totals.md](docs/specs/season-totals.md)).

### Changed

- The standings, the statistics, "Campeonatos" and the players' pages count a season known only by its final
  standings. The pots, the places and the progress night by night leave it out. Such a season takes no regular
  night and has no "Simulação", and its percentages cannot change.

## [1.30.0] - 2026-10-20

### Added

- "Estatísticas" in "Geral" has a tab "Campeonatos": players by titles, podiums and appearances in the final
  standings of the finished seasons. Players who share the 1st place of a season each count a title.
- "Classificação" of a finished season shows its first three with a medal each, in a box "Campeonato" above
  the Main Event box.

### Changed

- "Estatísticas" opens on "Geral", which comes first in the switch "Geral / Temporada".
- The specs say that a season has two champions, the season's by points and the Main Event's, and that each
  wins a trophy.

## [1.29.1] - 2026-10-17

### Fixed

- The night dashboard's "Resumo" shows no payout less than zero on a finished night. When the pot of a finished
  night is zero, as on a night of the past finished without the dashboard, it shows no payout, no Main Event pot
  and no house owner's discount.

## [1.29.0] - 2026-10-17

### Added

- A release can start from GitHub, without a terminal: "Run workflow" on the Release workflow, with the
  version. It does the checks of `task release`, makes the tag and builds the release in the same run.

## [1.28.1] - 2026-10-17

### Changed

- The night dashboard's "Resumo" shows "Em dinheiro" and "Fora do dinheiro" in "Dinheiro", right after the
  total, instead of under the payout.

## [1.28.0] - 2026-10-17

### Added

- The statistics' "Eventos" tab has a chart, "Rebuys por evento", on a site with the night dashboard: the
  rebuys of each night and, on a site with the time chip, the late players' time chips. In "Geral" it is
  "Rebuys por temporada".

### Changed

- The night dashboard's "Resumo" shows two tiles, the pot and the time chip, one amount each. Below them,
  "Dinheiro" adds the money up: the pot, the house owner's discount and the pot less it, the time chip and the
  total. A table then shows what was paid and what is pending of the pot and of the time chip, and the total
  pending. The payout follows in a section of its own.
- A finished night's attendance heads its ALL IN list "Jogaram". The "Dono da casa" badge has a color of its own.

## [1.27.1] - 2026-10-17

### Changed

- On a finished night's page, each player in "Jogadores" fits on one line: the name, the marks as small tags and
  what is pending. "Tudo pago" is no longer shown there.

## [1.27.0] - 2026-10-17

### Added

- The statistics count the rebuys and the late players' time chips that the night dashboard recorded.
- On a finished night's page, the result says how many rebuys and late arrivals the night had. Beside it, a
  read-only list shows what each player paid, in cash or not, their rebuys and their time chip.

### Changed

- The night dashboard is split into tabs: "Resumo", with a count of the payments, "Jogadores" and "Valores".
- On a finished night's page, the attendance is a small box under the result. The "Painel do evento" card is
  gone; an admin opens the dashboard from "Ações".
- The API spec is exported with the default address, not the worktree's port.

## [1.26.1] - 2026-10-17

### Fixed

- The payout ("Premiação") on the dashboard of a finished night subtracts the Main Event pot the night was
  finished with.

### Changed

- A release updates the changelog first, through a pull request of its own.

## [1.26.0] - 2026-10-17

### Changed

- The script that moves a site's core also writes the core's new version in the site's `backend/composer.lock`.

## [1.25.0] - 2026-10-17

### Added

- A script that moves a site's core to a new release through a pull request.

### Changed

- A release checks that the pull request behind `master`'s latest commit passed CI.
- Claude Code may merge pull requests and release without asking.

## [1.24.0] - 2026-10-17

### Added

- The night dashboard shows the night's payout.

### Changed

- The dashboard's total is named "Total com time chip" where it includes the time chip.

## [1.23.0] - 2026-10-16

### Added

- The night dashboard shows the night's rebuy count under the pot.

## [1.22.0] - 2026-10-16

### Added

- The night dashboard shows the pot for points and the house owner's discount.

### Changed

- The pot for points counts the house owner's full buy-in.

## [1.21.1] - 2026-10-16

### Fixed

- The ALL IN times that the `confirmed_at` migration in v1.21.0 overwrote are given back.

## [1.21.0] - 2026-10-16

### Changed

- When a player confirms again, the first ALL IN time is kept.

## [1.20.0] - 2026-10-15

### Added

- The night dashboard shows, under each name, when the player confirmed.

## [1.19.0] - 2026-10-15

### Added

- The open night's banner shows the number of ALL IN answers.

### Changed

- The night's actions card has a color, instead of the admin section.
- The admin section's cards have a faded color.

## [1.18.2] - 2026-10-15

### Fixed

- The manifest and the favicon are linked under the app's base, so Chrome can install the site.

## [1.18.1] - 2026-10-14

### Changed

- The night dashboard keeps its totals, players, amounts and positions whole with a large font.
- The attendance choices stay whole with a large font.

### Removed

- The night dashboard link on the open night's banner.

[Unreleased]: https://github.com/rrgmc/ptsite/compare/v1.34.0...HEAD
[1.34.0]: https://github.com/rrgmc/ptsite/compare/v1.33.0...v1.34.0
[1.33.0]: https://github.com/rrgmc/ptsite/compare/v1.32.1...v1.33.0
[1.32.1]: https://github.com/rrgmc/ptsite/compare/v1.32.0...v1.32.1
[1.32.0]: https://github.com/rrgmc/ptsite/compare/v1.31.1...v1.32.0
[1.31.1]: https://github.com/rrgmc/ptsite/compare/v1.31.0...v1.31.1
[1.31.0]: https://github.com/rrgmc/ptsite/compare/v1.30.0...v1.31.0
[1.30.0]: https://github.com/rrgmc/ptsite/compare/v1.29.1...v1.30.0
[1.29.1]: https://github.com/rrgmc/ptsite/compare/v1.29.0...v1.29.1
[1.29.0]: https://github.com/rrgmc/ptsite/compare/v1.28.1...v1.29.0
[1.28.1]: https://github.com/rrgmc/ptsite/compare/v1.28.0...v1.28.1
[1.28.0]: https://github.com/rrgmc/ptsite/compare/v1.27.1...v1.28.0
[1.27.1]: https://github.com/rrgmc/ptsite/compare/v1.27.0...v1.27.1
[1.27.0]: https://github.com/rrgmc/ptsite/compare/v1.26.1...v1.27.0
[1.26.1]: https://github.com/rrgmc/ptsite/compare/v1.26.0...v1.26.1
[1.26.0]: https://github.com/rrgmc/ptsite/compare/v1.25.0...v1.26.0
[1.25.0]: https://github.com/rrgmc/ptsite/compare/v1.24.0...v1.25.0
[1.24.0]: https://github.com/rrgmc/ptsite/compare/v1.23.0...v1.24.0
[1.23.0]: https://github.com/rrgmc/ptsite/compare/v1.22.0...v1.23.0
[1.22.0]: https://github.com/rrgmc/ptsite/compare/v1.21.1...v1.22.0
[1.21.1]: https://github.com/rrgmc/ptsite/compare/v1.21.0...v1.21.1
[1.21.0]: https://github.com/rrgmc/ptsite/compare/v1.20.0...v1.21.0
[1.20.0]: https://github.com/rrgmc/ptsite/compare/v1.19.0...v1.20.0
[1.19.0]: https://github.com/rrgmc/ptsite/compare/v1.18.2...v1.19.0
[1.18.2]: https://github.com/rrgmc/ptsite/compare/v1.18.1...v1.18.2
[1.18.1]: https://github.com/rrgmc/ptsite/compare/v1.18.0...v1.18.1
