// "Classificação": the season ranking, with the next night and the last result beside it.
export const standings = {
  title: 'Classificação',
  subtitle: ({ season, count }: { season: string; count: number }) => `${season} · ${count} ${count === 1 ? 'evento' : 'eventos'}`,
  noSeason: 'Nenhuma temporada cadastrada.',
  nobodyScored: 'Ninguém pontuou ainda nesta temporada.',
  tableCaption: ({ season }: { season: string }) => `Classificação da temporada ${season}`,
  /** A finished season's first three, above the table: the season champion and the next two. */
  championship: 'Campeonato',
  /** For screen readers: what the list of the first three is. */
  championshipCaption: ({ season }: { season: string }) => `Classificação final: ${season}`,

  // Table
  nightsCount: ({ count }: { count: number }) => `${count} ${count === 1 ? 'evento' : 'eventos'}`,
  winsCount: ({ count }: { count: number }) => `${count} ${count === 1 ? 'vitória' : 'vitórias'}`,

  // Side cards
  openNight: 'Evento aberto',
  nextNight: 'Próximo evento',
  placeToBeDefined: 'Local a definir',
  lastResult: 'Último resultado',
  seeAll: 'Ver todos',
  lastResultLine: ({ date, pot }: { date: string; pot: string }) => `${date} · Pote ${pot}`,
  simulate: '🔮 E se…? Simular o próximo evento',

  // The season recap, above the table (docs/specs/season-recaps.md)
  recap: 'Crônica da temporada',
  recapAfter: ({ date }: { date: string }) => `Depois do evento de ${date}`,
  recapDraft: 'Rascunho',
  olderRecaps: ({ count }: { count: number }) => `Crônicas anteriores (${count})`,
  hideOlderRecaps: 'Esconder crônicas anteriores',

  // Attendance under the next night
  coming: ({ count }: { count: number }) => `${count} ${count === 1 ? 'vai jogar' : 'vão jogar'} ·`,
  myAnswer: ({ answer }: { answer: string }) => `Você: ${answer}`,
  confirmPresence: 'Confirme sua presença',
}
