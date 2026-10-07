// "Classificação": the season ranking, with the next night and the last result beside it.
export const standings = {
  title: 'Classificação',
  subtitle: ({ season, count }: { season: string; count: number }) => `${season} · ${count} ${count === 1 ? 'evento' : 'eventos'}`,
  noSeason: 'Nenhuma temporada cadastrada.',
  nobodyScored: 'Ninguém pontuou ainda nesta temporada.',
  tableCaption: ({ season }: { season: string }) => `Classificação da temporada ${season}`,

  // Table
  scored: 'Pontuou',
  wins: 'Vitórias',
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

  // Attendance under the next night
  coming: ({ count }: { count: number }) => `${count} ${count === 1 ? 'vai jogar' : 'vão jogar'} ·`,
  myAnswer: ({ answer }: { answer: string }) => `Você: ${answer}`,
  confirmPresence: 'Confirme sua presença',
}
