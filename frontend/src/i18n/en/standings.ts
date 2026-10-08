import type { Messages } from '..'

export const standings: Messages['standings'] = {
  title: 'Standings',
  subtitle: ({ season, count }) => `${season} · ${count} ${count === 1 ? 'night' : 'nights'}`,
  noSeason: 'No seasons yet.',
  nobodyScored: 'Nobody has scored yet this season.',
  tableCaption: ({ season }) => `Standings of the season ${season}`,

  // Table
  nightsCount: ({ count }) => `${count} ${count === 1 ? 'night' : 'nights'}`,
  winsCount: ({ count }) => `${count} ${count === 1 ? 'win' : 'wins'}`,

  // Side cards
  openNight: 'Open night',
  nextNight: 'Next night',
  placeToBeDefined: 'Place to be defined',
  lastResult: 'Last result',
  seeAll: 'See all',
  lastResultLine: ({ date, pot }) => `${date} · Pot ${pot}`,
  simulate: '🔮 What if…? Simulate the next night',

  // Attendance under the next night
  coming: ({ count }) => `${count} ${count === 1 ? 'is playing' : 'are playing'} ·`,
  myAnswer: ({ answer }) => `You: ${answer}`,
  confirmPresence: 'Confirm your attendance',
}
