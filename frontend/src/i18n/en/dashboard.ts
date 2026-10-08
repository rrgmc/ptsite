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
    search: 'Find a player',
    searchPlaceholder: 'Nickname or name',
    hint: 'Type the nickname of who arrived to confirm them at one tap.',
    noneFound: 'No player found.',
    more: ({ shown, total }: { shown: number; total: number }) => `Showing ${shown} of ${total}. Type more to find one.`,
    confirm: 'Confirm',
    confirmPaid: 'Buy-in paid',
    actionsOf: ({ nickname }: { nickname: string }) => `Confirm ${nickname}`,
  },

  // The pot and the time chip typed by hand
  manual: {
    title: 'Pot and time chip',
    check: 'Set the pot and the time chip by hand',
    checkPotOnly: 'Set the pot by hand',
    help: 'For a night that does not record every player\'s payments. An empty amount uses the one worked out.',
    calculated: ({ amount }: { amount: string }) => `Worked out: ${amount}`,
    save: 'Save the amounts',
    /** Beside an amount at the foot of the screen that was typed by hand. */
    mark: 'by hand',
  },

  // Positions
  positions: {
    title: 'Positions',
    help: 'Each position is saved when its player is picked. The points are from the pot so far.',
    empty: 'No position filled.',
  },
  mainEventPot: {
    check: 'Set the Main Event pot by hand',
    suggested: ({ amount }: { amount: string }) => `Main Event pot: ${amount}, the share of the pot set in the season.`,
    none: 'Main Event pot: the season sets no share of the pot. Set it by hand, or enter it when finishing.',
    save: 'Save the Main Event pot',
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
