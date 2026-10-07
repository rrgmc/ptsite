import type { Messages } from '..'
import { plural } from '../plural'

export const seasons: Messages['seasons'] = {
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
