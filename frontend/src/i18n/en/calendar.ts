import type { Messages } from '..'

export const calendar: Messages['calendar'] = {
  title: 'Calendar',
  noSeason: 'No season yet.',
  noNights: 'No nights in this season yet.',

  // What happens on a day
  holidayNamed: ({ name }) => `Holiday: ${name}`,
  bridgeNamed: ({ name }) => `Bridge day: ${name}`,
  carnival: 'Carnival',
  noNight: ({ reason }) => `No night · ${reason}`,
  open: 'Open',
  placeToBeSet: 'Place to be set',
  allInCount: ({ count }) => `${count} ALL IN`,
  yourAnswer: ({ answer }) => `You: ${answer}`,

  // The next night
  nextNight: 'Next night:',
  viewInCalendar: 'View in the calendar',
  goToToday: 'Go to today',

  // From this month on, or the whole season
  viewAll: 'View the complete calendar',
  viewCurrent: 'View from this month on',

  // The legend
  legend: {
    night: 'Night',
    finished: 'Finished',
    skipped: 'No night (holiday)',
    holiday: 'Holiday',
  },
}
