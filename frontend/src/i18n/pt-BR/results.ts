// "Resultados": the finished nights of a season.
export const results = {
  title: 'Resultados',
  noSeason: 'Nenhuma temporada cadastrada.',
  upcoming: 'Próximos eventos',
  schedule: '+ Agendar',
  /** Shown when scheduling one more night than the season's rounds. */
  overPlanned: ({ planned, rounds }: { planned: number; rounds: number }) =>
    `A temporada já tem ${planned} eventos de ${rounds} rodadas. Ainda é possível agendar outro.`,
  noUpcoming: 'Nenhum evento agendado.',
  loadingChart: 'Carregando gráfico…',
  seasonTotals: 'Totais da temporada',
  noFinished: 'Nenhum evento finalizado nesta temporada.',

  // Schedule form
  scheduleForm: {
    loadingSuggestions: 'Carregando sugestões…',
    time: 'Hora',
    submit: 'Agendar evento',
  },

  // Suggested dates
  suggestions: {
    title: 'Sugestões',
    thisWeek: 'esta semana',
    nextWeek: 'próxima semana',
    inWeeks: ({ weeks }: { weeks: number }) => `em ${weeks} semanas`,
  },
}
