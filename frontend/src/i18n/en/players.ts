import type { Messages } from '..'

export const players: Messages['players'] = {
  // Players list
  listSubtitle: 'Active first, then inactive',
  viewLabel: 'View mode',
  viewList: 'List',
  viewDetailed: 'Detailed',
  searchPlaceholder: 'Nickname or name',
  noneWithMemo: 'No players with a memo.',
  noneFound: 'No players found.',

  // Player's page
  backToList: '‹ Players',
  noSeason: 'No seasons yet.',
  allSeasons: 'All seasons',
  statistics: 'Statistics',
  myProfile: 'My profile',
  photoAlt: ({ nickname }) => `Photo of ${nickname}`,
  email: 'Email',
  birthDate: 'Birth date',
  overallPosition: 'Overall position',
  nightsScored: 'Nights scored',
  wins: 'Wins',
  notScoredYet: 'Has not scored yet.',
  notScoredThisSeason: 'Has not scored this season yet.',
  bySeason: 'By season',
  bySeasonCaption: ({ nickname }) => `Standings of ${nickname} in each season`,
  scored: 'Scored',
  nightsAndWins: ({ nights, wins }) => `${nights} ${nights === 1 ? 'night' : 'nights'} · ${wins} ${wins === 1 ? 'win' : 'wins'}`,
  loadingCharts: 'Loading charts…',
  results: 'Results',
  resultsCaption: ({ nickname }) => `Nights where ${nickname} scored, newest first`,

  // The player's photo editor
  photo: {
    unreadable: 'This file could not be read. Choose a JPEG, PNG or WebP image.',
    none: 'No photo',
    help: 'Shown next to the nickname in the lists, and opens when tapped. The site uses the middle of the image.',
    replaceLabel: 'Replace photo',
    sendLabel: 'Upload photo',
    replace: 'Replace',
    send: 'Upload',
    removeLabel: 'Remove photo',
    removeConfirmTitle: 'Remove the photo?',
    removeConfirmText: ({ nickname }) => `The photo of ${nickname} will no longer show on the site.`,
  },
}
