// Attendance: the answers ALL IN and FOLD, the panel on a night and the banner of the open night.
export const attendance = {
  allIn: 'ALL IN',
  fold: 'FOLD',
  notConfirmed: 'Não confirmado',

  // Banner
  banner: {
    label: 'Evento aberto',
    title: ({ weekday }: { weekday: string }) => `Evento aberto: ${weekday}`,
    you: 'Você: {answer}',
    confirmPresence: 'Confirme sua presença',
    change: 'Alterar',
  },

  // Panel
  panel: {
    titleOpen: 'Confirme sua presença',
    title: 'Presença',
    yourAnswer: 'Sua resposta',
    notOpenYet: 'As confirmações começam quando o evento for aberto.',
    comingHeading: ({ count }: { count: number }) => `Vão jogar (${count})`,
    nobodyConfirmed: 'Ninguém confirmou ainda.',
    foldedHeading: ({ count }: { count: number }) => `Fold (${count})`,
    nobody: 'Ninguém.',
    answeredBy: ({ name }: { name: string }) => ` · por ${name}`,
    answerForOther: 'Responder por outro jogador',
  },
}
