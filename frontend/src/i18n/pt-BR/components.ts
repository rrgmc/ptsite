import { plural } from '../plural'

// The shared components of src/components. Most texts reach them as props; these are the ones they write themselves.
export const components = {
  // Feedback
  connectionError: 'Algo deu errado. Verifique sua conexão e tente de novo.',

  // MonthGrid
  monthGrid: {
    /** The column headers, Sunday first: the letter is shown, the name is read by screen readers. */
    weekdays: [
      { short: 'D', long: 'Domingo' },
      { short: 'S', long: 'Segunda-feira' },
      { short: 'T', long: 'Terça-feira' },
      { short: 'Q', long: 'Quarta-feira' },
      { short: 'Q', long: 'Quinta-feira' },
      { short: 'S', long: 'Sexta-feira' },
      { short: 'S', long: 'Sábado' },
    ],
    legend: 'Legenda',
    /** Added to a day's description when it is today. */
    todayNote: '(hoje)',
  },

  // NewPasswordFields
  newPassword: {
    label: 'Nova senha',
    hint: 'Pelo menos 8 caracteres.',
    repeatLabel: 'Repetir a nova senha',
    mismatch: 'As duas senhas não são iguais.',
  },

  // PeriodSwitch
  periodSwitch: {
    label: 'Período',
    allTime: 'Geral',
  },

  // PlayerPicker
  playerPicker: {
    /** For screen readers, after the player who is already chosen. */
    chosen: '(escolhido)',
    choose: 'Escolher jogador',
    searchLabel: 'Buscar jogador',
    searchPlaceholder: 'Buscar pelo apelido',
    noneFound: 'Nenhum jogador encontrado.',
    leaveBlank: 'Deixar em branco',
    activeGroup: 'Ativos',
    inactiveGroup: 'Inativos',
    adding: 'Adicionando…',
    addNew: ({ nickname }: { nickname: string }) => `+ Adicionar “${nickname}” como novo jogador`,
  },

  // PlayerThumbnail
  playerPhoto: {
    view: ({ nickname }: { nickname: string }) => `Ver foto de ${nickname}`,
    alt: ({ nickname }: { nickname: string }) => `Foto de ${nickname}`,
  },

  // RankedList
  rankedList: {
    /** For screen readers, after the position of a line that shares it. */
    tied: '(empatado)',
    moreTied: ({ count }: { count: number }) => `e mais ${count} ${plural(count, { one: 'empatado', other: 'empatados' })}`,
  },
}
