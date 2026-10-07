import type { Messages } from '..'

export const common: Messages['common'] = {
  save: 'Save',
  cancel: 'Cancel',
  close: 'Close',
  back: 'Back',
  edit: 'Edit',
  remove: 'Remove',
  archive: 'Archive',
  restore: 'Restore',
  activate: 'Activate',
  deactivate: 'Deactivate',
  search: 'Search',
  reload: 'Reload',
  select: 'Select',
  logOut: 'Log out',

  loading: 'Loading…',
  inactive: 'inactive',
  archived: 'archived',
  today: 'Today',

  player: 'Player',
  players: 'Players',
  night: 'Night',
  nights: 'Nights',
  season: 'Season',
  seasons: 'Seasons',
  place: 'Place',
  places: 'Places',
  points: 'Points',
  position: 'Position',
  pot: 'Pot',
  date: 'Date',
  name: 'Name',
  nickname: 'Nickname',
  password: 'Password',

  ordinal: ({ position }: { position: number }) => {
    const tens = position % 100
    const suffix = tens >= 11 && tens <= 13 ? 'th' : (['th', 'st', 'nd', 'rd'][position % 10] ?? 'th')
    return `${position}${suffix}`
  },

  roles: {
    player: 'Player',
    results_keeper: 'Results keeper',
    admin: 'Admin',
  },
}
