import type { Messages } from '..'

export const nights: Messages['nights'] = {
  noPlace: 'Place to be defined',
  someone: 'someone',
  someoneStart: 'Someone',
  confirmed: 'Confirmed',
  backToNight: 'Back to the night',
  nightCancelled: 'This night was cancelled.',
  editNight: 'Edit night',
  invalidMoney: 'Invalid amount. For example, use 840 or 840.50.',
  nightOrder: 'Night standings',
  partialResult: 'Partial result',

  marks: {
    mainEvent: 'Main Event',
    extra: 'Extra',
  },
  mainEventTitlePrefix: 'Main Event',

  status: {
    scheduled: 'Scheduled',
    open: 'Open',
    finished: 'Finished',
  },

  amounts: {
    potTotal: 'Total pot',
    mainEventPot: 'Main Event pot',
    timeChip: 'Time chip',
  },

  moneyFields: {
    pot: ({ currency }: { currency: string }) => `Pot (${currency})`,
    mainEventPot: ({ currency }: { currency: string }) => `Main Event pot (${currency})`,
    timeChip: ({ currency }: { currency: string }) => `Time chip (${currency})`,
    potPlaceholder: '840.00',
    mainEventPotPlaceholder: '170.00',
    timeChipPlaceholder: '40.00',
  },

  finishingOrder: {
    positionLabel: ({ position, percent }: { position: string; percent: number }) => `${position} place · ${percent}%`,
    positionPoints: ({ position }: { position: string }) => `Points for ${position} place`,
  },

  // The night's page
  page: {
    actions: 'Actions',
    openNight: 'Open night',
    reschedule: 'Reschedule',
    cancelNight: 'Cancel night',
    finishEnterResult: 'Finish: enter result',
    editResult: 'Edit result',
    resultPlaceholder: 'The result appears here when the night is finished.',
    cancelConfirmTitle: 'Cancel this night?',
    cancelConfirmBody: 'The night leaves the calendar and the date becomes free. The attendance answers stay in the history.',
    openConfirmTitle: 'Open this night?',
    openConfirmBody: 'Only one night per season can be open.',
  },

  // Reschedule form
  reschedule: {
    formLabel: 'Reschedule night',
    newDate: 'New date',
    newTime: 'New time',
    save: 'Save new date',
  },

  // Edit a night
  edit: {
    onlyKeepersEdit: 'Only results keepers and admins edit a night.',
    onlyAdminsEdit: 'Only admins edit an open or finished night.',
    description: 'Description',
    descriptionHelp: "Shown on the night's page.",
    extra: 'Extra night',
    extraHelp: "It is outside the season's calendar: it is not a round and may be on the same day as another night. Its points count like any night's.",
  },

  // The partial result card
  partialCard: {
    empty: 'Nobody has filled in the partial result yet.',
    savedBy: ({ name, time }: { name: string; time: string }) => `Saved by ${name} at ${time}. It does not count for points yet.`,
    fill: 'Fill in partial result',
    edit: 'Edit partial result',
  },

  // The partial result form
  partialForm: {
    onlyActivePlayers: 'Only active players fill in the partial result.',
    notOpen: 'This night is not open.',
    intro: 'Fill in what you already know. Any active player can change it; the last save wins.',
    savedByOther: ({ name, time }: { name: string; time: string }) => `${name} saved at ${time}, after you opened this screen.`,
    mainEventPotHelp: 'The part set aside for the Main Event.',
    timeChipHelp: 'Rebuys and late arrivals, set aside for the year party.',
    savedAt: ({ time }: { time: string }) => `Saved at ${time}.`,
    save: 'Save partial result',
  },

  // The results form
  resultForm: {
    titleEdit: 'Edit result',
    titleFinish: 'Finish night',
    filledFromPartial: ({ name, time }: { name: string; time: string }) =>
      `Filled in with the partial result saved by ${name} at ${time}. Check it before finishing.`,
    mainEventPotHelp: 'The part set aside for the Main Event. Use 0 if there was none.',
    timeChipHelp: 'Rebuys and late arrivals, set aside for the year party. Use 0 if there were none.',
    saveCorrection: 'Save correction',
    finish: 'Finish night',
  },
}
