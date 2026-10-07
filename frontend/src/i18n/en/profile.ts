import type { Messages } from '..'

export const profile: Messages['profile'] = {
  title: 'My profile',
  username: ({ username }) => `Username: ${username}`,
  myData: 'My details',
  myPhoto: 'My photo',
  myPassword: 'My password',
  noPlayer: 'This login is not linked to a player, so it only has a password.',

  // Password form
  currentPassword: 'Current password',
  changePassword: 'Change password',
  passwordChanged: 'Password changed.',

  // Details form
  nicknameHelp: 'The name shown in the standings and the results.',
  fullName: 'Full name',
  email: 'Email',
  emailHelp: 'Only you and the admins can see it.',
  birthDate: 'Birth date',
  birthDateHelp: 'Only you and the admins can see it.',
  saved: 'Details saved.',
}
