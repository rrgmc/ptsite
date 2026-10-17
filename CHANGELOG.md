# Changelog

All notable changes to the PTSite core are written in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html). A release is a git tag on `master` (see
[RELEASE.md](RELEASE.md)). This file starts at v1.18.1; the GitHub releases list the earlier versions.

## [Unreleased]

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

[Unreleased]: https://github.com/rrgmc/ptsite/compare/v1.26.1...HEAD
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
