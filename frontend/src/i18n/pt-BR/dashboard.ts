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
    empty: 'Nenhum jogador ainda. Adicione quem chegou na busca abaixo.',
    houseOwner: 'Dono da casa',
    buyIn: 'Buy-in',
    timeChip: 'Time chip',
    timeChipPaid: 'TC pago',
    rebuy: ({ number }: { number: number }) => `Rebuy ${number}`,
    /** What a screen reader says for a payment that was not in cash: "Buy-in (fora do dinheiro)". */
    nonCash: ({ payment }: { payment: string }) => `${payment} (fora do dinheiro)`,
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
    heading: 'Adicionar jogador',
    searchPlaceholder: 'Apelido ou nome',
    noneFound: 'Nenhum jogador encontrado.',
    more: ({ shown, total }: { shown: number; total: number }) => `Mostrando ${shown} de ${total}. Digite mais para encontrar.`,
    /** Brings the player onto the night with nothing paid: the answer it gives them. */
    confirm: 'ALL IN',
    confirmPaid: 'Buy-in pago',
    actionsOf: ({ nickname }: { nickname: string }) => `Adicionar ${nickname}`,
  },

  // The amounts, each worked out unless it is set by hand
  manual: {
    title: 'Valores',
    /** The mark beside each amount, and beside one set by hand at the foot of the screen. */
    mark: 'Manual',
    checkPot: 'Definir o pote manualmente',
    checkTimeChip: 'Definir o time chip manualmente',
    checkMainEventPot: 'Definir o pote ME manualmente',
    /** An amount added to what was paid not in cash, for anything out of the ordinary. It may be negative. */
    nonCashAdjustment: ({ currency }: { currency: string }) => `Ajuste fora do dinheiro (${currency})`,
    /** The mark beside the adjustment. */
    use: 'Usar',
    checkNonCashAdjustment: 'Usar o ajuste fora do dinheiro',
    save: 'Salvar',
  },

  // Positions
  positions: {
    title: 'Posições',
    empty: 'Nenhuma posição preenchida.',
  },
  // The amounts
  totals: {
    label: 'Valores do evento',
    calculated: ({ amount }: { amount: string }) => `Calculado ${amount}`,
    pot: 'Pote',
    timeChip: 'Time chip',
    total: 'Total',
    paid: ({ amount }: { amount: string }) => `Pago ${amount}`,
    pending: ({ amount }: { amount: string }) => `Falta ${amount}`,
    /** Of what was paid: what should be in hand, and what was paid another way, such as a bank transfer. */
    cash: ({ amount }: { amount: string }) => `Em dinheiro ${amount}`,
    nonCash: ({ amount }: { amount: string }) => `Fora do dinheiro ${amount}`,
  },
  recorded: {
    title: 'Resultado registrado',
    help: 'Os valores com que o evento foi finalizado. Eles contam para os pontos; os do painel, não.',
  },

  // The card on the night's page
  card: {
    open: 'Abrir o painel',
    help: 'Pagamentos, rebuys e posições do evento, em uma tela para o celular.',
  },
  /** On "Finalizar", above a form filled from the dashboard. */
  filledFromDashboard: 'Preenchido com os valores e as posições do painel do evento.',
  stillPending: ({ amount }: { amount: string }) => `Ainda falta receber ${amount}.`,
}
