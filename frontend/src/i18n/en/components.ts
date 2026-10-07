import type { Messages } from '..'

export const components: Messages['components'] = {
  // Feedback
  connectionError: 'Something went wrong. Check your connection and try again.',

  // MonthGrid
  monthGrid: {
    weekdays: [
      { short: 'S', long: 'Sunday' },
      { short: 'M', long: 'Monday' },
      { short: 'T', long: 'Tuesday' },
      { short: 'W', long: 'Wednesday' },
      { short: 'T', long: 'Thursday' },
      { short: 'F', long: 'Friday' },
      { short: 'S', long: 'Saturday' },
    ],
    legend: 'Legend',
    todayNote: '(today)',
  },

  // NewPasswordFields
  newPassword: {
    label: 'New password',
    hint: 'At least 8 characters.',
    repeatLabel: 'Repeat the new password',
    mismatch: 'The two passwords do not match.',
  },

  // PeriodSwitch
  periodSwitch: {
    label: 'Period',
    allTime: 'All time',
  },

  // PlayerPicker
  playerPicker: {
    chosen: '(chosen)',
    choose: 'Choose player',
    searchLabel: 'Search player',
    searchPlaceholder: 'Search by nickname',
    noneFound: 'No player found.',
    leaveBlank: 'Leave blank',
    activeGroup: 'Active',
    inactiveGroup: 'Inactive',
    adding: 'Adding…',
    addNew: ({ nickname }) => `+ Add “${nickname}” as a new player`,
  },

  // PlayerThumbnail
  playerPhoto: {
    view: ({ nickname }) => `View ${nickname}'s photo`,
    alt: ({ nickname }) => `Photo of ${nickname}`,
  },

  // RankedList
  rankedList: {
    tied: '(tied)',
    moreTied: ({ count }) => `and ${count} more tied`,
  },
}
