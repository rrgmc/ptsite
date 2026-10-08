// The season calendar.
export const calendar = {
  title: 'Calendário',
  noSeason: 'Nenhuma temporada cadastrada.',
  noNights: 'Nenhum evento nesta temporada ainda.',

  // What happens on a day
  holidayNamed: ({ name }: { name: string }) => `Feriado: ${name}`,
  bridgeNamed: ({ name }: { name: string }) => `Emenda: ${name}`,
  carnival: 'Carnaval',
  /** A regular night left out; `reason` is the holiday. */
  noNight: ({ reason }: { reason: string }) => `Sem evento · ${reason}`,
  open: 'Aberto',
  placeToBeSet: 'Local a definir',
  allInCount: ({ count }: { count: number }) => `${count} ALL IN`,
  /** `answer` is "ALL IN" or "FOLD". */
  yourAnswer: ({ answer }: { answer: string }) => `Você: ${answer}`,

  // The next night
  nextNight: 'Próximo evento:',
  viewInCalendar: 'Ver no calendário',
  goToToday: 'Ir para hoje',

  // This month and the next, or the whole season
  viewAll: 'Ver o calendário completo',
  viewCurrent: 'Ver só este mês e o próximo',

  // The legend
  legend: {
    night: 'Evento',
    finished: 'Finalizado',
    skipped: 'Sem evento (feriado)',
    holiday: 'Feriado',
  },
}
