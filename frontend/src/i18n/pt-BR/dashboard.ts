import { plural } from '../plural'

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

  // The tabs the dashboard is split into; the players' tab is titled by players.heading
  tabs: {
    label: 'Partes do painel',
    summary: 'Resumo',
  },

  // The first tab: the night at a glance
  summary: {
    /** The money paid out to the players: the total without the time chip, less the Main Event pot. */
    payout: 'Premiação',
    mainEventPot: 'Pote ME',
    /** Of what was paid: what should be in hand, and what was paid another way, such as a bank transfer. */
    cash: 'Em dinheiro',
    nonCash: 'Fora do dinheiro',
    payments: 'Pagamentos',
    noPlayers: 'Nenhum jogador ainda.',
    /** The participants who owe nothing more. */
    settled: 'Jogadores com tudo pago',
    buyIns: 'Buy-ins pagos',
    rebuys: 'Rebuys pagos',
    /** The late players' time chips. */
    timeChips: 'Time chips pagos',
    ofTotal: ({ paid, total }: { paid: number; total: number }) => `${paid} de ${total}`,
    missing: ({ count }: { count: number }) => `${plural(count, { one: 'falta', other: 'faltam' })} ${count}`,
  },

  // Participants
  players: {
    heading: ({ count }: { count: number }) => `Jogadores (${count})`,
    empty: 'Nenhum jogador ainda. Adicione quem chegou na busca abaixo.',
    houseOwner: 'Dono da casa',
    /** Under the name: when the player answered ALL IN. */
    confirmedAt: ({ date, time }: { date: string; time: string }) => `Confirmou ${date} às ${time}`,
    buyIn: 'Buy-in',
    timeChip: 'Time chip',
    timeChipPaid: 'TC pago',
    rebuy: ({ number }: { number: number }) => `Rebuy ${number}`,
    /** What a screen reader says for a payment that was not in cash: "Buy-in (fora do dinheiro)". */
    nonCash: ({ payment }: { payment: string }) => `${payment} (fora do dinheiro)`,
    /** Beside what the player has pending: how much they paid not in cash, with the sign of such a payment. */
    nonCashAmount: ({ amount }: { amount: string }) => `(⇄ ${amount})`,
    nonCashAmountSpoken: ({ amount }: { amount: string }) => `${amount} fora do dinheiro`,
    addRebuy: '+ Rebuy',
    pending: ({ amount }: { amount: string }) => `Falta ${amount}`,
    settled: 'Tudo pago',
    marksOf: ({ nickname }: { nickname: string }) => `Pagamentos de ${nickname}`,
    moreActions: ({ nickname }: { nickname: string }) => `Mais ações de ${nickname}`,
    setHouseOwner: 'É o dono da casa',
    unsetHouseOwner: 'Não é o dono da casa',
    removeLastRebuy: 'Remover o último rebuy',
    removeFromNight: 'Remover do evento',
    /** What a screen reader says for a chip on the night's page, where nothing is changed: "Rebuy 1: não pago". */
    chipState: ({ payment, state }: { payment: string; state: string }) => `${payment}: ${state}`,
    paid: 'pago',
    paidCash: 'pago em dinheiro',
    paidNonCash: 'pago fora do dinheiro',
    unpaid: 'não pago',
    lateArrival: 'chegou atrasado',
  },

  // Under the participants: what the signs on a buy-in and on a rebuy mean
  legend: {
    cash: 'Pago em dinheiro',
    nonCash: 'Pago fora do dinheiro (transferência, Pix)',
    howTo: 'Toque de novo no pagamento para trocar.',
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
    /** The mark beside each amount, and beside one set by hand in the summary. */
    mark: 'Manual',
    checkPot: 'Definir o pote manualmente',
    checkTimeChip: 'Definir o time chip manualmente',
    checkMainEventPot: 'Definir o pote ME manualmente',
    /** An amount added to what was paid not in cash, for anything out of the ordinary. It may be negative. */
    nonCashAdjustment: ({ currency }: { currency: string }) => `Ajuste fora do dinheiro (${currency})`,
    nonCashAdjustmentHelp: 'Para algo fora do comum. O valor é somado ao que foi pago fora do dinheiro; com sinal de menos, é subtraído.',
    checkNonCashAdjustment: 'Ajustar o valor fora do dinheiro',
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
    /** The total on a site with the time chip, which it includes. */
    totalWithTimeChip: 'Total com time chip',
    paid: ({ amount }: { amount: string }) => `Pago ${amount}`,
    pending: ({ amount }: { amount: string }) => `Falta ${amount}`,
    /** The pot for points counts the house owner's buy-in in full; the money owed is less by this much. */
    houseOwnerDiscount: ({ amount }: { amount: string }) => `Desconto do dono da casa ${amount}`,
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
