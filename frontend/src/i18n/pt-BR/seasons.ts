import { plural } from '../plural'

// "Temporadas": choosing the season on screen.
export const seasons = {
  subtitle: 'Escolha a temporada que o site mostra.',
  noSeason: 'Nenhuma temporada cadastrada.',
  started: ({ date, count }: { date: string; count: number }) => `Início ${date} · ${count} ${plural(count, { one: 'evento', other: 'eventos' })}`,
  selected: '✓ Selecionada',

  // The badges
  current: 'Atual',
  finished: 'Finalizada',
  open: 'Aberta',
  closed: 'Fechada',
}
