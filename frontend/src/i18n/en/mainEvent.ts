import type { Messages } from '..'

export const mainEvent: Messages['mainEvent'] = {
  title: 'Main Event',
  noSeason: 'No season yet.',

  // The season's screen
  potTitle: "The season's Main Event pot",
  potHelp: 'The Main Event pot of the finished nights, added up.',
  notScheduled: 'The Main Event of this season is not scheduled yet.',
  notPlayed: 'The Main Event has not been played yet.',
  seeNight: 'See the night',
  /** On the standings: the way from the first three to the whole Main Event. */
  seeMainEvent: 'See the Main Event',
  manage: 'Edit the Main Event',

  // The result
  resultTitle: 'Main Event result',
  resultCaption: ({ night }) => `Result: ${night}`,
  resultPlaceholder: 'The result appears here when the Main Event is finished.',

  // The result form
  resultForm: {
    titleFinish: 'Finish the Main Event',
    titleEdit: 'Edit the result',
    help: 'Enter the players in finishing order, the champion first. Only the 1st place is required.',
    positionLabel: ({ position }) => `${position} place`,
    removePosition: ({ position }) => `Remove the ${position} place`,
    finish: 'Finish the Main Event',
    saveCorrection: 'Save correction',
    notMainEvent: 'This night is not a Main Event.',
  },
}
