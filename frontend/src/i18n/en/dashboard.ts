// The night dashboard: who paid what on a night, on a screen of its own made for a phone.
export const dashboard = {
  title: 'Night dashboard',
  backToSite: 'Back to the site',
  updatedAt: ({ time }: { time: string }) => `Updated at ${time}`,
  readOnly: 'You can see the dashboard, but not change it.',
  finishedReadOnly: 'The night is finished. Only an admin changes the dashboard.',
  finishedAdmin: 'The night is finished. Changes go to the audit log and do not change the result.',
  houseOwnerIs: 'House owner: {name}',
  noHouseOwner: 'House owner: nobody',

  // Participants
  players: {
    heading: ({ count }: { count: number }) => `Players (${count})`,
    empty: 'No players yet. Confirm who arrived in the list below.',
    houseOwner: 'House owner',
    buyIn: 'Buy-in',
    timeChip: 'Time chip',
    timeChipPaid: 'TC paid',
    rebuy: ({ number }: { number: number }) => `Rebuy ${number}`,
    addRebuy: '+ Rebuy',
    pending: ({ amount }: { amount: string }) => `${amount} pending`,
    settled: 'All paid',
    marksOf: ({ nickname }: { nickname: string }) => `Payments of ${nickname}`,
    moreActions: ({ nickname }: { nickname: string }) => `More actions for ${nickname}`,
    setHouseOwner: 'Is the house owner',
    unsetHouseOwner: 'Is not the house owner',
    removeLastRebuy: 'Remove the last rebuy',
    removeFromNight: 'Remove from the night',
  },

  // Players who are not on the night yet
  others: {
    heading: ({ count }: { count: number }) => `Not confirmed (${count})`,
    confirm: 'Confirm',
    confirmPaid: 'Buy-in paid',
    addOther: 'Another player',
    actionsOf: ({ nickname }: { nickname: string }) => `Confirm ${nickname}`,
  },

  // Positions and the Main Event pot
  positions: {
    title: 'Positions',
    help: 'Each position is saved when its player is picked. The points are from the pot worked out so far.',
    empty: 'No position filled.',
  },
  mainEventPot: {
    save: 'Save',
    useSuggested: ({ amount }: { amount: string }) => `Use ${amount}`,
    suggested: ({ amount }: { amount: string }) => `Suggested by the season: ${amount}`,
  },

  // The amounts
  totals: {
    label: 'Amounts of the night',
    pot: 'Pot',
    timeChip: 'Time chip',
    total: 'Total',
    paid: ({ amount }: { amount: string }) => `${amount} paid`,
    pending: ({ amount }: { amount: string }) => `${amount} pending`,
  },
  recorded: {
    title: 'Recorded result',
    help: 'The amounts the night was finished with. They count for the points; the dashboard\'s do not.',
  },
  finish: 'Finish the night',

  // The card on the night's page
  card: {
    open: 'Open the dashboard',
    help: 'Payments, rebuys and positions of the night, on a screen made for a phone.',
  },
  /** On the finish form, above a form filled from the dashboard. */
  filledFromDashboard: 'Filled with the amounts and the positions of the night dashboard.',
  stillPending: ({ amount }: { amount: string }) => `${amount} is still to be received.`,
}
