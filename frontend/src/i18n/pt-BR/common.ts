// Texts used in more than one area: actions, states, the things the site is about and the roles.
export const common = {
  // Actions
  save: 'Salvar',
  cancel: 'Cancelar',
  close: 'Fechar',
  back: 'Voltar',
  edit: 'Editar',
  remove: 'Remover',
  archive: 'Arquivar',
  restore: 'Restaurar',
  activate: 'Ativar',
  deactivate: 'Inativar',
  search: 'Buscar',
  reload: 'Recarregar',
  select: 'Selecione',
  logOut: 'Sair',

  // States
  loading: 'Carregando…',
  inactive: 'inativo',
  archived: 'arquivado',
  today: 'Hoje',

  // The things the site is about
  player: 'Jogador',
  players: 'Jogadores',
  night: 'Evento',
  nights: 'Eventos',
  season: 'Temporada',
  seasons: 'Temporadas',
  place: 'Local',
  places: 'Locais',
  points: 'Pontos',
  position: 'Posição',
  pot: 'Pote',
  date: 'Data',
  name: 'Nome',
  nickname: 'Apelido',
  password: 'Senha',

  /** A place in an order: 1 is "1º". */
  ordinal: ({ position }: { position: number }) => `${position}º`,

  /** The roles as the screens name them (docs/specs/accounts-and-roles.md). */
  roles: {
    player: 'Jogador',
    results_keeper: 'Responsável',
    admin: 'Administrador',
  },
}
