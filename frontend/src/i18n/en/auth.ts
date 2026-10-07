import type { Messages } from '..'

export const auth: Messages['auth'] = {
  logIn: 'Log in',
  username: 'Username',
  password: 'Password',
  stayLoggedIn: 'Stay logged in for 30 days',
  forgotPassword: 'I forgot my password',

  // I forgot my password
  forgot: {
    sent: 'We sent a link to {email}. It works for 60 minutes. Check your spam folder too.',
    intro: 'Enter your username or your email. We will send you a link to choose a new password.',
    loginLabel: 'Username or email',
    sendLink: 'Send link',
    backToLogin: 'Back to log in',
  },

  // New password
  reset: {
    title: 'New password',
    done: 'Password changed. Log in with the new password.',
    invalidLink: 'This link is not valid. Ask for a new link.',
    requestNewLink: 'Ask for a new link',
    choose: 'Choose a new password for the user {username}.',
    save: 'Save new password',
  },
}
