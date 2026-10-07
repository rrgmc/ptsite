import type { Messages } from '..'

export const attendance: Messages['attendance'] = {
  allIn: 'ALL IN',
  fold: 'FOLD',
  notConfirmed: 'Not confirmed',

  // Banner
  banner: {
    label: 'Open night',
    title: ({ weekday }: { weekday: string }) => `Open night: ${weekday}`,
    you: 'You: {answer}',
    confirmPresence: 'Confirm your attendance',
    change: 'Change',
  },

  // Panel
  panel: {
    titleOpen: 'Confirm your attendance',
    title: 'Attendance',
    yourAnswer: 'Your answer',
    notOpenYet: 'Answers start when the night is opened.',
    comingHeading: ({ count }: { count: number }) => `Playing (${count})`,
    nobodyConfirmed: 'Nobody has confirmed yet.',
    foldedHeading: ({ count }: { count: number }) => `Fold (${count})`,
    nobody: 'Nobody.',
    answeredBy: ({ name }: { name: string }) => ` · by ${name}`,
    answerForOther: 'Answer for another player',
  },
}
