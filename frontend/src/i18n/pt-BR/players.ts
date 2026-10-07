// The players list and a player's page.
export const players = {
  // Players list
  listSubtitle: 'Ativos primeiro, depois inativos',
  viewLabel: 'Modo de exibição',
  viewList: 'Lista',
  viewDetailed: 'Detalhado',
  searchPlaceholder: 'Apelido ou nome',
  noneWithMemo: 'Nenhum jogador com memo.',
  noneFound: 'Nenhum jogador encontrado.',

  // Player's page
  backToList: '‹ Jogadores',
  noSeason: 'Nenhuma temporada cadastrada.',
  allSeasons: 'Todas as temporadas',
  statistics: 'Estatísticas',
  myProfile: 'Meu perfil',
  photoAlt: ({ nickname }: { nickname: string }) => `Foto de ${nickname}`,
  email: 'E-mail',
  birthDate: 'Nascimento',
  overallPosition: 'Posição geral',
  nightsScored: 'Eventos pontuando',
  wins: 'Vitórias',
  notScoredYet: 'Ainda não pontuou.',
  notScoredThisSeason: 'Ainda não pontuou nesta temporada.',
  bySeason: 'Por temporada',
  bySeasonCaption: ({ nickname }: { nickname: string }) => `Classificação de ${nickname} em cada temporada`,
  scored: 'Pontuou',
  /** The nights and wins of a season, under its name at phone width. */
  nightsAndWins: ({ nights, wins }: { nights: number; wins: number }) =>
    `${nights} ${nights === 1 ? 'evento' : 'eventos'} · ${wins} ${wins === 1 ? 'vitória' : 'vitórias'}`,
  loadingCharts: 'Carregando gráficos…',
  results: 'Resultados',
  resultsCaption: ({ nickname }: { nickname: string }) => `Eventos em que ${nickname} pontuou, do mais recente ao mais antigo`,

  // The player's photo editor
  photo: {
    unreadable: 'Não foi possível ler este arquivo. Escolha uma imagem JPEG, PNG ou WebP.',
    none: 'Sem foto',
    help: 'Aparece ao lado do apelido nas listas e abre ao tocar nela. O site usa o meio da imagem.',
    replaceLabel: 'Trocar foto',
    sendLabel: 'Enviar foto',
    replace: 'Trocar',
    send: 'Enviar',
    removeLabel: 'Remover foto',
    removeConfirmTitle: 'Remover a foto?',
    removeConfirmText: ({ nickname }: { nickname: string }) => `A foto de ${nickname} deixa de aparecer no site.`,
  },
}
