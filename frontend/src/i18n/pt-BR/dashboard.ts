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
    search: 'Buscar jogador',
    searchPlaceholder: 'Apelido ou nome',
    hint: 'Digite o apelido de quem chegou para confirmar com um toque.',
    noneFound: 'Nenhum jogador encontrado.',
    more: ({ shown, total }: { shown: number; total: number }) => `Mostrando ${shown} de ${total}. Digite mais para encontrar.`,
    confirm: 'Confirmar',
    confirmPaid: 'Buy-in pago',
    actionsOf: ({ nickname }: { nickname: string }) => `Confirmar ${nickname}`,
  },

  // The pot and the time chip typed by hand
  manual: {
    title: 'Pote e time chip',
    check: 'Definir o pote e o time chip manualmente',
    checkPotOnly: 'Definir o pote manualmente',
    help: 'Para um evento que não registra os pagamentos de cada jogador. Um valor em branco usa o calculado.',
    calculated: ({ amount }: { amount: string }) => `Calculado: ${amount}`,
    save: 'Salvar valores',
    /** Beside an amount at the foot of the screen that was typed by hand. */
    mark: 'manual',
  },

  // Positions
  positions: {
    title: 'Posições',
    help: 'Cada posição é salva ao escolher o jogador. Os pontos são do pote até agora.',
    empty: 'Nenhuma posição preenchida.',
  },
  mainEventPot: {
    check: 'Definir o pote ME manualmente',
    suggested: ({ amount }: { amount: string }) => `Pote ME: ${amount}, a parte do pote definida na temporada.`,
    none: 'Pote ME: a temporada não define uma parte do pote. Defina manualmente, ou informe ao finalizar.',
    save: 'Salvar pote ME',
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
