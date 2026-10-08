// The Main Event: its screen for a season, its result and the form that enters it.
export const mainEvent = {
  title: 'Main Event',
  noSeason: 'Nenhuma temporada cadastrada.',

  // The season's screen
  potTitle: 'Pote ME da temporada',
  potHelp: 'A soma do pote ME dos eventos finalizados.',
  notScheduled: 'O Main Event desta temporada ainda não foi marcado.',
  notPlayed: 'O Main Event ainda não foi jogado.',
  seeNight: 'Ver o evento',
  scheduleHelp: 'Para marcar o Main Event, agende um evento do tipo Main Event em Resultados.',
  goToResults: 'Ir para Resultados',
  recordPast: 'Registrar um Main Event já jogado',

  // Recording a past Main Event
  importForm: {
    label: 'Registrar Main Event já jogado',
    time: 'Hora',
    submit: 'Registrar Main Event',
  },

  // The result
  resultTitle: 'Classificação do Main Event',
  /** For screen readers: what the list is. */
  resultCaption: ({ night }: { night: string }) => `Classificação: ${night}`,
  resultPlaceholder: 'A classificação aparece aqui quando o Main Event for finalizado.',

  // The result form
  resultForm: {
    titleFinish: 'Finalizar Main Event',
    titleEdit: 'Editar classificação',
    help: 'Informe os jogadores na ordem de chegada, a partir do campeão. Só o 1º lugar é obrigatório.',
    /** `position` is already the ordinal, such as "1º". */
    positionLabel: ({ position }: { position: string }) => `${position} lugar`,
    removePosition: ({ position }: { position: string }) => `Remover o ${position} lugar`,
    finish: 'Finalizar Main Event',
    saveCorrection: 'Salvar correção',
    notMainEvent: 'Este evento não é um Main Event.',
  },
}
