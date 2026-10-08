import type { FeatureName } from '../../site/features'
import { plural } from '../plural'

// The admin section: seasons, players, places, holidays, accounts, the audit log and the settings.
export const admin = {
  // The section
  title: 'Administração',
  adminOnly: 'Somente administradores.',

  // Actions on a list row, named after the item they act on
  archiveItem: ({ name }: { name: string }) => `Arquivar ${name}`,
  restoreItem: ({ name }: { name: string }) => `Restaurar ${name}`,
  activateItem: ({ name }: { name: string }) => `Ativar ${name}`,
  deactivateItem: ({ name }: { name: string }) => `Inativar ${name}`,
  editItem: ({ name }: { name: string }) => `Editar ${name}`,
  archiveConfirmTitle: ({ name }: { name: string }) => `Arquivar ${name}?`,

  // The regular night's weekday and frequency
  weekdays: {
    monday: 'Segunda',
    tuesday: 'Terça',
    wednesday: 'Quarta',
    thursday: 'Quinta',
    friday: 'Sexta',
    saturday: 'Sábado',
    sunday: 'Domingo',
  },
  everyWeeks: {
    one: 'Toda semana',
    two: 'A cada 2 semanas',
    three: 'A cada 3 semanas',
    four: 'A cada 4 semanas',
  },

  // Audit log
  auditLog: {
    /** The tab of the admin menu. */
    tab: 'Alterações',
    system: 'Sistema',
    /** Shown where there is no value before the change. */
    empty: '—',
    beforeAndAfter: 'Antes e depois',
    previous: 'Anteriores',
    next: 'Próximas',
    /** What the person did, by the code the API sends; a code with no text here shows as it is. */
    actions: {
      'night.scheduled': 'agendou o evento',
      'night.opened': 'abriu o evento',
      'night.finished': 'finalizou o evento',
      'night.corrected': 'corrigiu o resultado do evento',
      'night.imported': 'importou o evento',
      'night.rescheduled': 'remarcou o evento',
      'night.updated': 'editou o evento',
      'night.cancelled': 'cancelou o evento',
      'attendance.set_for_player': 'respondeu a presença por um jogador',
      'holiday.created': 'criou o feriado',
      'holiday.updated': 'alterou o feriado',
      'holiday_exception.created': 'alterou os feriados de um ano',
      'holiday_exception.deleted': 'desfez uma alteração nos feriados de um ano',
      'player.quick_added': 'adicionou rapidamente o jogador',
      'player.created': 'criou o jogador',
      'player.updated': 'alterou o jogador',
      'player.image_saved': 'enviou uma foto do jogador',
      'player.image_removed': 'removeu uma foto do jogador',
      'login.created': 'criou o acesso ao site',
      'login.updated': 'alterou o acesso ao site',
      'login.password_changed': 'alterou a própria senha',
      'login.password_reset_requested': 'enviou um link para redefinir a senha',
      'login.password_reset': 'redefiniu a senha pelo link do e-mail',
      'season.created': 'criou a temporada',
      'season.updated': 'alterou a temporada',
      'place.created': 'criou o local',
      'place.updated': 'alterou o local',
    } as Record<string, string>,
  },

  // Holidays
  holidays: {
    /** The tab of the admin menu. */
    tab: 'Feriados',
    intro:
      'Dias sem evento. Evento em feriado, na véspera de feriado (emenda) ou no fim de semana de Carnaval fica de fora das datas de cada temporada.',
    scopeNational: 'Nacional',
    scopeState: 'Estadual (SP)',
    scopeCity: 'Municipal (São Paulo)',
    scopeOneYear: 'Só neste ano',
    yearTitle: ({ year }: { year: number }) => `Feriados de ${year}`,
    previousYear: 'Ano anterior',
    nextYear: 'Próximo ano',
    notThisYear: ({ year }: { year: number }) => `Não haverá em ${year}`,
    onlyThisYear: ({ year }: { year: number }) => `Só em ${year}`,
    undo: 'Desfazer',
    wontHappen: 'Não haverá',
    extraTitle: ({ year }: { year: number }) => `Feriado só em ${year}`,
    add: 'Adicionar',
    tableTitle: 'Tabela de feriados',
    newHoliday: '+ Novo feriado',
    archiveConfirmBody: 'O feriado deixa de contar nas datas das temporadas e sai dos calendários. Dá para restaurar depois, nesta tabela.',
    scope: 'Abrangência',
    when: 'Quando',
    sameDayEveryYear: 'Mesmo dia todo ano',
    relativeToEaster: 'Relativo à Páscoa',
    dayAndMonth: 'Dia e mês',
    /** An example of the day and month to type. */
    dayAndMonthExample: '21/04',
    daysAfterEaster: 'Dias depois da Páscoa',
    daysAfterEasterHelp: 'Negativo para antes: Sexta-feira Santa é −2, Corpus Christi é 60.',
    firstYear: 'A partir do ano (opcional)',
    /** How a table holiday falls each year, then the years it applies to. */
    rule: {
      fixed: ({ day, month }: { day: string; month: string }) => `Todo ano em ${day}/${month}`,
      easterSunday: 'No domingo de Páscoa',
      daysBefore: ({ days }: { days: number }) => `${days} ${plural(days, { one: 'dia', other: 'dias' })} antes da Páscoa`,
      daysAfter: ({ days }: { days: number }) => `${days} ${plural(days, { one: 'dia', other: 'dias' })} depois da Páscoa`,
      between: ({ rule, first, last }: { rule: string; first: number; last: number }) => `${rule}, de ${first} a ${last}`,
      since: ({ rule, first }: { rule: string; first: number }) => `${rule}, desde ${first}`,
      until: ({ rule, last }: { rule: string; last: number }) => `${rule}, até ${last}`,
    },
  },

  // Settings: what the site was built with, to read only
  settings: {
    /** The tab of the admin menu. */
    tab: 'Configurações',
    featuresTitle: 'Recursos',
    featuresIntro: 'As partes do site que esta liga usa. Elas são definidas na configuração do site e não mudam por aqui.',
    on: 'Ligado',
    off: 'Desligado',
    /** Every feature a site can turn off (site/README.md, "Features"). */
    features: {
      mainEventPot: { name: 'Pote ME', description: 'O dinheiro que cada evento separa para o Main Event.' },
      timeChip: { name: 'Time chip', description: 'O dinheiro que cada evento separa para a festa do ano.' },
      seasonPlanner: { name: 'Planejar datas', description: 'O calendário que agenda de uma vez os eventos habituais de uma temporada.' },
      mainEvent: {
        name: 'Main Event',
        description: 'O jogo final da temporada: um evento de tipo próprio, com a ordem de chegada dos jogadores, sem pote e sem pontos.',
      },
      houseOwnerBuyIn: { name: 'Buy-in do dono da casa', description: 'O buy-in menor de uma temporada para o dono da casa onde o evento acontece.' },
    } satisfies Record<FeatureName, { name: string; description: string }>,
    versionTitle: 'Versão',
    /** The only version of a build of the core itself. */
    version: 'Versão',
    siteVersion: 'Versão do site',
    coreVersion: 'Versão do PTSite',
  },

  // Places
  places: {
    newPlace: '+ Novo local',
    noAddress: 'Sem endereço',
    archiveConfirmBody:
      'O local deixa de aparecer na escolha de local dos eventos e das temporadas. Os eventos que já são nele não mudam. Dá para restaurar depois, nesta lista.',
    back: '‹ Locais',
    notFound: 'Local não encontrado.',
    newTitle: 'Novo local',
    address: 'Endereço',
  },

  // Players
  players: {
    newPlayer: '+ Novo jogador',
    archiveConfirmBody: 'O jogador deixa de aparecer no site, fora da Administração. Os resultados dele não mudam. Dá para restaurar depois.',
    back: '‹ Jogadores',
    newTitle: 'Novo jogador',
    viewPage: 'Ver página',
    fullName: 'Nome completo',
    email: 'E-mail',
    birthDate: 'Data de nascimento',
    memo: 'Memo',
    memoHelp: 'Um texto livre sobre o jogador. Todos veem na página do jogador.',
    statusArchived: 'Arquivado',
    statusActive: 'Ativo',
    statusInactive: 'Inativo',
    photo: 'Foto',
  },

  // The player's login ("Acesso ao site")
  login: {
    title: 'Acesso ao site',
    username: 'Usuário',
    noLogin: 'Sem acesso ao site. Crie um usuário e uma senha para este jogador.',
    ownRole: ({ role }: { role: string }) => `Papel: ${role}. Você não pode mudar o seu próprio papel.`,
    role: 'Papel',
    newPassword: 'Nova senha',
    passwordKeepHelp: 'Deixe em branco para manter a senha atual.',
    passwordMinHelp: 'Pelo menos 8 caracteres.',
    saved: 'Acesso salvo.',
    save: 'Salvar acesso',
    create: 'Criar acesso',
  },

  // The Main Event of a season
  mainEvent: {
    title: ({ season }: { season: string }) => `Main Event · ${season}`,
    /** For screen readers: the link of one season among many. */
    linkLabel: ({ season }: { season: string }) => `Main Event: ${season}`,
    formLabel: 'Adicionar Main Event',
    intro: 'Esta temporada ainda não tem Main Event. Informe a data e a hora: o Main Event não segue o dia e o horário habituais da temporada.',
    time: 'Hora',
    orderTitle: 'Classificação (se já foi jogado)',
    orderHelp: 'Deixe em branco para agendar o Main Event. Se ele já foi jogado, informe os jogadores na ordem de chegada, a partir do campeão: ele é registrado como finalizado.',
    schedule: 'Agendar Main Event',
    record: 'Registrar Main Event',
    nightHelp: 'A data, o local, a descrição e o cancelamento ficam na página do evento.',
    seeNight: 'Ver o evento',
    finish: 'Finalizar: lançar classificação',
    editResult: 'Editar classificação',
    notOpenYet: 'Abra o evento para lançar a classificação.',
  },

  // Seasons
  seasons: {
    newSeason: '+ Nova temporada',
    /** The title of the list and its columns. */
    listTitle: 'Temporadas',
    columns: { season: 'Temporada', start: 'Início', nights: 'Eventos', finished: 'Finalizados', status: 'Situação', actions: 'Ações' },
    finished: 'Finalizada',
    open: 'Aberta',
    closed: 'Fechada',
    planDates: 'Planejar datas',
    mainEvent: 'Main Event',
    back: '‹ Temporadas',
    notFound: 'Temporada não encontrada.',
    newTitle: 'Nova temporada',
    start: 'Início',
    rounds: 'Rodadas',
    roundsHelp: 'Quantos eventos a temporada tem (normalmente 26). Vazio na nova temporada: igual à anterior.',
    defaultPlace: 'Local padrão',
    regularNight: 'Evento habitual (usado para sugerir datas)',
    weekday: 'Dia da semana',
    time: 'Horário',
    frequency: 'Frequência',
    sameAsPrevious: 'Igual à temporada anterior',
    /** What a night of the season costs. */
    money: {
      title: 'Valores',
      buyIn: ({ currency }: { currency: string }) => `Buy-in (${currency})`,
      houseOwnerBuyIn: ({ currency }: { currency: string }) => `Buy-in do dono da casa (${currency})`,
      houseOwnerBuyInHelp: 'O dono da casa onde o evento acontece paga menos. Vazio: paga o buy-in.',
      timeChipValue: ({ currency }: { currency: string }) => `Valor do time chip (${currency})`,
      rebuysAllowed: 'Rebuys permitidos',
      rebuysAllowedHelp: 'Quantos rebuys cada jogador pode fazer por evento. 0: nenhum.',
      allowsExtraRebuys: 'Permitir rebuys além do limite, sem contar pontos na temporada',
      rebuyValue: ({ currency }: { currency: string }) => `Valor do rebuy (${currency})`,
      rebuyValueHelp: 'Sem o time chip.',
      rebuyChargesTimeChip: 'O rebuy também paga o time chip',
    },
    percentages: 'Pontuação (% do pote por posição)',
    total: ({ total }: { total: number }) => `Total: ${total}%`,
    addPosition: '+ posição',
    removePosition: '− posição',
    isFinished: 'Temporada finalizada',
  },

  // Season planner
  planner: {
    title: ({ name }: { name: string }) => `Planejar datas · ${name}`,
    /** The season's regular night, then what the plan leaves out. */
    intro: ({ weekday, time, every }: { weekday: string; time: string; every: string }) =>
      `${weekday} às ${time}, ${every}. Feriados, emendas e o Carnaval ficam de fora. Toque num dia para marcar ou desmarcar.`,
    from: 'De',
    to: 'Até',
    toLastRound: ({ round }: { round: number }) => `Até a última rodada (${round}ª)`,
    endOfYear: 'Fim do ano',
    scheduledCount: ({ count }: { count: number }) => (count === 1 ? '1 evento agendado.' : `${count} eventos agendados.`),
    viewCalendar: 'Ver o calendário',
    calculating: 'Calculando datas…',
    reasonHoliday: ({ holiday }: { holiday: string }) => `Feriado: ${holiday}`,
    reasonBridge: ({ holiday }: { holiday: string }) => `Emenda: ${holiday}`,
    reasonCarnival: 'Carnaval',
    reasonRegular: 'Evento habitual',
    alreadyScheduled: 'Já agendado',
    ticked: ({ label }: { label: string }) => `${label}, marcado`,
    extraTicked: 'evento extra, marcado',
    extraTickedAfter: ({ label }: { label: string }) => `${label}, evento extra, marcado`,
    roundsOf: ({ planned, rounds }: { planned: number; rounds: number }) => `Rodadas: ${planned} de ${rounds}`,
    planned: ({ scheduled, marked }: { scheduled: number; marked: number }) => `${scheduled} já agendadas + ${marked} marcadas neste plano.`,
    overPlan: ({ rounds }: { rounds: number }) => `A temporada tem ${rounds} rodadas; este plano passa de ${rounds}. Ainda é possível agendar.`,
    legendMarked: 'Marcado',
    legendCandidate: 'Evento habitual, desmarcado',
    legendSkipped: 'Fica de fora (feriado)',
    legendScheduled: 'Já agendado',
    legendHoliday: 'Feriado',
    skippedNote: ({ reason }: { reason: string }) => `${reason} · fica de fora`,
    schedule: ({ count }: { count: number }) => (count === 1 ? 'Agendar 1 evento' : `Agendar ${count} eventos`),
  },
}
