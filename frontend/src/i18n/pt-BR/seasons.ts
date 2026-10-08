import { plural } from '../plural'

// "Temporadas", the seasons with their first ten, and "Escolher temporada", choosing the season on screen.
export const seasons = {
  overviewSubtitle: 'Os dez primeiros de cada temporada.',
  view: 'Ver esta temporada',
  /** For screen readers: the button of one season among many. */
  viewSeason: ({ season }: { season: string }) => `Ver esta temporada: ${season}`,
  noResults: 'Nenhum evento finalizado ainda.',
  /** For screen readers: what a season's list is. */
  topTenCaption: ({ season }: { season: string }) => `Os dez primeiros de ${season}`,

  /** Before the nickname of the 1st place of a season's Main Event. */
  mainEventChampion: 'Campeão do Main Event:',

  pickTitle: 'Escolher temporada',
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
