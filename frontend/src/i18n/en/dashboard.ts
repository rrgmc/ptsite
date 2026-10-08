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
    empty: 'No players yet. Add who arrived with the search below.',
    houseOwner: 'House owner',
    buyIn: 'Buy-in',
    timeChip: 'Time chip',
    timeChipPaid: 'TC paid',
    rebuy: ({ number }: { number: number }) => `Rebuy ${number}`,
    nonCash: ({ payment }: { payment: string }) => `${payment} (not in cash)`,
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
    heading: 'Add a player',
    searchPlaceholder: 'Nickname or name',
    noneFound: 'No player found.',
    more: ({ shown, total }: { shown: number; total: number }) => `Showing ${shown} of ${total}. Type more to find one.`,
    /** Brings the player onto the night with nothing paid: the answer it gives them. */
    confirm: 'ALL IN',
    confirmPaid: 'Buy-in paid',
    actionsOf: ({ nickname }: { nickname: string }) => `Add ${nickname}`,
  },

  // The amounts, each worked out unless it is set by hand
  manual: {
    title: 'Amounts',
    /** The mark beside each amount, and beside one set by hand at the foot of the screen. */
    mark: 'By hand',
    checkPot: 'Set the pot by hand',
    checkTimeChip: 'Set the time chip by hand',
    checkMainEventPot: 'Set the Main Event pot by hand',
    nonCashAdjustment: ({ currency }: { currency: string }) => `Not-in-cash adjustment (${currency})`,
    use: 'Use',
    checkNonCashAdjustment: 'Use the not-in-cash adjustment',
    save: 'Save',
  },

  // Positions
  positions: {
    title: 'Positions',
    empty: 'No position filled.',
  },
  // The amounts
  totals: {
    label: 'Amounts of the night',
    calculated: ({ amount }: { amount: string }) => `${amount} worked out`,
    pot: 'Pot',
    timeChip: 'Time chip',
    total: 'Total',
    paid: ({ amount }: { amount: string }) => `${amount} paid`,
    pending: ({ amount }: { amount: string }) => `${amount} pending`,
    cash: ({ amount }: { amount: string }) => `${amount} in cash`,
    nonCash: ({ amount }: { amount: string }) => `${amount} not in cash`,
  },
  recorded: {
    title: 'Recorded result',
    help: 'The amounts the night was finished with. They count for the points; the dashboard\'s do not.',
  },

  // The card on the night's page
  card: {
    open: 'Open the dashboard',
    help: 'Payments, rebuys and positions of the night, on a screen made for a phone.',
  },
  /** On the finish form, above a form filled from the dashboard. */
  filledFromDashboard: 'Filled with the amounts and the positions of the night dashboard.',
  stillPending: ({ amount }: { amount: string }) => `${amount} is still to be received.`,
}
