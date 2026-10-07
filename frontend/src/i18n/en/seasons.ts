import type { Messages } from '..'
import { plural } from '../plural'

export const seasons: Messages['seasons'] = {
  overviewSubtitle: 'The first ten of every season.',
  view: 'View this season',
  viewSeason: ({ season }) => `View this season: ${season}`,
  noResults: 'No finished night yet.',
  topTenCaption: ({ season }) => `The first ten of ${season}`,

  pickTitle: 'Choose a season',
  subtitle: 'Choose the season the site shows.',
  noSeason: 'No season yet.',
  started: ({ date, count }) => `Starts ${date} · ${count} ${plural(count, { one: 'night', other: 'nights' })}`,
  selected: '✓ Selected',

  // The badges
  current: 'Current',
  finished: 'Finished',
  open: 'Open',
  closed: 'Closed',
}
