import type { Messages } from '..'

export const results: Messages['results'] = {
  title: 'Results',
  noSeason: 'No season registered.',
  upcoming: 'Upcoming nights',
  schedule: '+ Schedule',
  overPlanned: ({ planned, rounds }: { planned: number; rounds: number }) =>
    `The season already has ${planned} nights out of ${rounds} rounds. You can still schedule another.`,
  noUpcoming: 'No night scheduled.',
  loadingChart: 'Loading chart…',
  seasonTotals: 'Season totals',
  noFinished: 'No night finished in this season.',

  // Schedule form
  scheduleForm: {
    loadingSuggestions: 'Loading suggestions…',
    time: 'Time',
    submit: 'Schedule night',
  },

  // Suggested dates
  suggestions: {
    title: 'Suggestions',
    thisWeek: 'this week',
    nextWeek: 'next week',
    inWeeks: ({ weeks }: { weeks: number }) => `in ${weeks} weeks`,
  },
}
