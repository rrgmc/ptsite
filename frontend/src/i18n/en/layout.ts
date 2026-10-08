import type { Messages } from '..'

export const layout: Messages['layout'] = {
  nav: {
    standings: 'Standings',
    results: 'Results',
    calendar: 'Calendar',
    simulator: 'Simulator',
    players: 'Players',
    statistics: 'Statistics',
    seasons: 'Seasons',
    mainEvent: 'Main Event',
    profile: 'My profile',
    admin: 'Admin',
  },

  // AppLayout and NavDrawer
  mainNav: 'Main',
  menu: 'Menu',
  seasonPrefix: 'Season:',

  // SeasonNotice
  seasonNotice: {
    label: 'Selected season',
    viewing: 'You are viewing {season}, which is not the current season.',
    backToCurrent: 'Back to the current one',
  },

  // ErrorPage
  errorPage: {
    notFoundTitle: 'Page not found',
    notFoundText: 'This address does not exist.',
    errorTitle: 'Something went wrong',
    errorText: 'Try again. If the problem continues, tell whoever looks after the site.',
    toStandings: 'Go to the standings',
  },
}
