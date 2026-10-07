import type { Messages } from '..'

export const simulator: Messages['simulator'] = {
  title: 'Simulator',
  subtitle: ({ season }) => `What if the next night ends like this? · ${season}`,
  noSeason: 'No season yet.',

  // The form
  potLabel: ({ currency }) => `Imagined pot (${currency})`,
  potExample: '840.00',
  positionLabel: ({ position, percent }) => `${position} place · ${percent}%`,
  simulate: 'Simulate',
  nothingSaved: 'Nothing is saved.',

  // The result
  resultTitle: 'Simulated standings',
  resultEmpty: 'Enter the pot and the finishing order to see what the standings would look like.',
  simulated: 'Simulated',
  newEntry: 'new',
  newEntryTitle: 'Would enter the standings',
  movesUp: 'moves up',
  movesDown: 'moves down',
}
