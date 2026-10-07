// A night: its page, scheduling, opening, the partial result and the results form.
export const nights = {
  noPlace: 'Local a definir',
  /** Someone, when the name of who saved is not known, inside a sentence. */
  someone: 'alguém',
  /** Someone, when the name of who saved is not known, at the start of a sentence. */
  someoneStart: 'Alguém',
  confirmed: 'Confirmados',
  backToNight: 'Voltar ao evento',
  nightCancelled: 'Este evento foi cancelado.',
  editNight: 'Editar evento',
  invalidMoney: 'Valor inválido. Use por exemplo 840 ou 840,50.',
  nightOrder: 'Classificação do evento',
  partialResult: 'Resultado parcial',

  status: {
    scheduled: 'Agendado',
    open: 'Aberto',
    finished: 'Finalizado',
  },

  /** The three amounts of a night, as rows of a list. */
  amounts: {
    potTotal: 'Pote Total',
    mainEventPot: 'Pote ME',
    timeChip: 'Time chip',
  },

  /** The money fields of the results forms. */
  moneyFields: {
    pot: ({ currency }: { currency: string }) => `Pote (${currency})`,
    mainEventPot: ({ currency }: { currency: string }) => `Pote ME (${currency})`,
    timeChip: ({ currency }: { currency: string }) => `Time chip (${currency})`,
    potPlaceholder: '840,00',
    mainEventPotPlaceholder: '170,00',
    timeChipPlaceholder: '40,00',
  },

  /** The scoring position's label, and its points; `position` is already the ordinal, such as "1º". */
  finishingOrder: {
    positionLabel: ({ position, percent }: { position: string; percent: number }) => `${position} lugar · ${percent}%`,
    positionPoints: ({ position }: { position: string }) => `Pontos do ${position} lugar`,
  },

  // The night's page
  page: {
    actions: 'Ações',
    openNight: 'Abrir evento',
    reschedule: 'Remarcar',
    cancelNight: 'Cancelar evento',
    finishEnterResult: 'Finalizar: lançar resultado',
    editResult: 'Editar resultado',
    resultPlaceholder: 'O resultado aparece aqui quando o evento for finalizado.',
    cancelConfirmTitle: 'Cancelar este evento?',
    cancelConfirmBody: 'O evento sai do calendário e a data fica livre. As respostas de presença ficam guardadas no histórico.',
    openConfirmTitle: 'Abrir este evento?',
    openConfirmBody: 'Só um evento por temporada pode ficar aberto.',
  },

  // Reschedule form
  reschedule: {
    formLabel: 'Remarcar evento',
    newDate: 'Nova data',
    newTime: 'Novo horário',
    save: 'Salvar nova data',
  },

  // Edit a night
  edit: {
    onlyKeepersEdit: 'Só responsáveis e administradores editam um evento.',
    onlyAdminsEdit: 'Só administradores editam um evento aberto ou finalizado.',
    description: 'Descrição',
    descriptionHelp: 'Aparece na página do evento.',
  },

  // The partial result card
  partialCard: {
    empty: 'Ninguém preencheu o resultado parcial ainda.',
    savedBy: ({ name, time }: { name: string; time: string }) => `Salvo por ${name} às ${time}. Ainda não vale pontos.`,
    fill: 'Preencher resultado parcial',
    edit: 'Editar resultado parcial',
  },

  // The partial result form
  partialForm: {
    onlyActivePlayers: 'Só jogadores ativos preenchem o resultado parcial.',
    notOpen: 'Este evento não está aberto.',
    intro: 'Preencha o que já souber. Qualquer jogador ativo pode alterar; vale o último que salvar.',
    savedByOther: ({ name, time }: { name: string; time: string }) => `${name} salvou às ${time}, depois de você abrir esta tela.`,
    mainEventPotHelp: 'A parte guardada para o Main Event.',
    timeChipHelp: 'Rebuys e atrasos, guardado para a festa de fim de ano.',
    savedAt: ({ time }: { time: string }) => `Salvo às ${time}.`,
    save: 'Salvar resultado parcial',
  },

  // The results form
  resultForm: {
    titleEdit: 'Editar resultado',
    titleFinish: 'Finalizar evento',
    filledFromPartial: ({ name, time }: { name: string; time: string }) =>
      `Preenchido com o resultado parcial salvo por ${name} às ${time}. Confira antes de finalizar.`,
    mainEventPotHelp: 'A parte guardada para o Main Event. Use 0 se não houve.',
    timeChipHelp: 'Rebuys e atrasos, guardado para a festa de fim de ano. Use 0 se não houve.',
    saveCorrection: 'Salvar correção',
    finish: 'Finalizar evento',
  },
}
