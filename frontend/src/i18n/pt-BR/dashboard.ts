// The night dashboard ("Painel do evento"): who paid what on a night, on a screen of its own made for a phone.
export const dashboard = {
  title: 'Painel do evento',
  backToSite: 'Voltar ao site',
  updatedAt: ({ time }: { time: string }) => `Atualizado às ${time}`,
  readOnly: 'Você pode ver o painel, mas não alterar.',
  finishedReadOnly: 'O evento foi finalizado. Só um administrador altera o painel.',
  finishedAdmin: 'O evento foi finalizado. As alterações ficam no registro de auditoria e não mudam o resultado.',
  houseOwnerIs: 'Dono da casa: {name}',
  noHouseOwner: 'Dono da casa: ninguém',

  // Participants
  players: {
    heading: ({ count }: { count: number }) => `Jogadores (${count})`,
    empty: 'Nenhum jogador ainda. Confirme quem chegou na lista abaixo.',
    houseOwner: 'Dono da casa',
    buyIn: 'Buy-in',
    timeChip: 'Time chip',
    timeChipPaid: 'TC pago',
    rebuy: ({ number }: { number: number }) => `Rebuy ${number}`,
    addRebuy: '+ Rebuy',
    pending: ({ amount }: { amount: string }) => `Falta ${amount}`,
    settled: 'Tudo pago',
    marksOf: ({ nickname }: { nickname: string }) => `Pagamentos de ${nickname}`,
    moreActions: ({ nickname }: { nickname: string }) => `Mais ações de ${nickname}`,
    setHouseOwner: 'É o dono da casa',
    unsetHouseOwner: 'Não é o dono da casa',
    removeLastRebuy: 'Remover o último rebuy',
    removeFromNight: 'Remover do evento',
  },

  // Players who are not on the night yet
  others: {
    heading: ({ count }: { count: number }) => `Não confirmados (${count})`,
    confirm: 'Confirmar',
    confirmPaid: 'Buy-in pago',
    addOther: 'Outro jogador',
    actionsOf: ({ nickname }: { nickname: string }) => `Confirmar ${nickname}`,
  },

  // Positions and the Main Event pot
  positions: {
    title: 'Posições',
    help: 'Cada posição é salva ao escolher o jogador. Os pontos são do pote calculado até agora.',
    empty: 'Nenhuma posição preenchida.',
  },
  mainEventPot: {
    save: 'Salvar',
    useSuggested: ({ amount }: { amount: string }) => `Usar ${amount}`,
    suggested: ({ amount }: { amount: string }) => `Sugerido pela temporada: ${amount}`,
  },

  // The amounts
  totals: {
    label: 'Valores do evento',
    pot: 'Pote',
    timeChip: 'Time chip',
    total: 'Total',
    paid: ({ amount }: { amount: string }) => `Pago ${amount}`,
    pending: ({ amount }: { amount: string }) => `Falta ${amount}`,
  },
  recorded: {
    title: 'Resultado registrado',
    help: 'Os valores com que o evento foi finalizado. Eles contam para os pontos; os do painel, não.',
  },
  finish: 'Finalizar evento',

  // The card on the night's page
  card: {
    open: 'Abrir o painel',
    help: 'Pagamentos, rebuys e posições do evento, em uma tela para o celular.',
  },
  /** On "Finalizar", above a form filled from the dashboard. */
  filledFromDashboard: 'Preenchido com os valores e as posições do painel do evento.',
  stillPending: ({ amount }: { amount: string }) => `Ainda falta receber ${amount}.`,
}
