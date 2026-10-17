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

  // The tabs the dashboard is split into; the players' tab is titled by players.heading
  tabs: {
    label: 'Parts of the dashboard',
    summary: 'Summary',
  },

  // The first tab: the night at a glance
  summary: {
    /** The money paid out to the players: the total without the time chip, less the Main Event pot. */
    payout: 'Payout',
    mainEventPot: 'Main Event pot',
    cash: 'In cash',
    nonCash: 'Not in cash',
    payments: 'Payments',
    noPlayers: 'No players yet.',
    settled: 'Players with everything paid',
    buyIns: 'Buy-ins paid',
    rebuys: 'Rebuys paid',
    timeChips: 'Time chips paid',
    ofTotal: ({ paid, total }: { paid: number; total: number }) => `${paid} of ${total}`,
    missing: ({ count }: { count: number }) => `${count} missing`,
  },

  // Participants
  players: {
    heading: ({ count }: { count: number }) => `Players (${count})`,
    empty: 'No players yet. Add who arrived with the search below.',
    houseOwner: 'House owner',
    confirmedAt: ({ date, time }: { date: string; time: string }) => `Confirmed ${date} at ${time}`,
    buyIn: 'Buy-in',
    timeChip: 'Time chip',
    timeChipPaid: 'TC paid',
    rebuy: ({ number }: { number: number }) => `Rebuy ${number}`,
    nonCash: ({ payment }: { payment: string }) => `${payment} (not in cash)`,
    nonCashAmount: ({ amount }: { amount: string }) => `(⇄ ${amount})`,
    nonCashAmountSpoken: ({ amount }: { amount: string }) => `${amount} not in cash`,
    addRebuy: '+ Rebuy',
    pending: ({ amount }: { amount: string }) => `${amount} pending`,
    settled: 'All paid',
    marksOf: ({ nickname }: { nickname: string }) => `Payments of ${nickname}`,
    moreActions: ({ nickname }: { nickname: string }) => `More actions for ${nickname}`,
    setHouseOwner: 'Is the house owner',
    unsetHouseOwner: 'Is not the house owner',
    removeLastRebuy: 'Remove the last rebuy',
    removeFromNight: 'Remove from the night',
    chipState: ({ payment, state }: { payment: string; state: string }) => `${payment}: ${state}`,
    paid: 'paid',
    paidCash: 'paid in cash',
    paidNonCash: 'paid not in cash',
    unpaid: 'not paid',
    lateArrival: 'arrived late',
  },

  // Under the participants: what the signs on a buy-in and on a rebuy mean
  legend: {
    cash: 'Paid in cash',
    nonCash: 'Paid not in cash (a bank transfer)',
    howTo: 'Tap the payment again to change it.',
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
    /** The mark beside each amount, and beside one set by hand in the summary. */
    mark: 'By hand',
    checkPot: 'Set the pot by hand',
    checkTimeChip: 'Set the time chip by hand',
    checkMainEventPot: 'Set the Main Event pot by hand',
    nonCashAdjustment: ({ currency }: { currency: string }) => `Not-in-cash adjustment (${currency})`,
    nonCashAdjustmentHelp: 'For anything out of the ordinary. The amount is added to what was paid not in cash; with a minus sign, it is taken from it.',
    checkNonCashAdjustment: 'Adjust the amount not in cash',
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
    totalWithTimeChip: 'Total with time chip',
    paid: ({ amount }: { amount: string }) => `${amount} paid`,
    pending: ({ amount }: { amount: string }) => `${amount} pending`,
    houseOwnerDiscount: ({ amount }: { amount: string }) => `${amount} house owner's discount`,
  },
  // The summary's money added up, under the tiles
  money: {
    title: 'Money',
    pot: 'Pot total',
    houseOwnerDiscount: "House owner's discount",
    timeChip: 'Time chip total',
    potPayments: 'Pot',
    timeChipPayments: 'Time chip',
    totalPending: 'Total pending',
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
