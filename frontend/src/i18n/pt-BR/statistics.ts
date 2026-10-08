// "Estatísticas": the top ten lists and the charts, for one season or every season.
export const statistics = {
  title: 'Estatísticas',
  noSeason: 'Nenhuma temporada cadastrada.',
  allSeasons: 'Todas as temporadas',
  noNights: 'Nenhum evento finalizado ainda.',

  // Top ten lists
  totalPoints: 'Pontuação Total',
  totalPointsCaption: 'Jogadores por pontuação total',
  nightsScored: 'Eventos Pontuando',
  nightsScoredCaption: 'Jogadores por eventos em que pontuaram',
  biggestPots: 'Maiores Potes',
  biggestPotsCaption: 'Eventos por pote',
  places: 'Locais',
  noPlaces: 'Nenhum evento com local.',
  placesCaption: 'Locais por número de eventos',
  // "Posições": a line per player and a column per scoring position
  positionTableCaption: 'Jogadores por vezes em cada posição',
  /** In place of a zero: the player never finished in that position. */
  never: '–',
  /** Read by screen readers after the highest number of a column. */
  highestOfPosition: '(o maior da posição)',
  showAll: ({ count }: { count: number }) => `Ver todos (${count})`,
  showFirst: ({ count }: { count: number }) => `Ver só os ${count} primeiros`,
  times: 'Vezes',

  // The Main Events of every season, on a site that has the Main Event
  mainEvent: 'Main Event',
  mainEventTitles: 'Títulos',
  mainEventTitlesCaption: 'Jogadores por títulos do Main Event',
  mainEventPodiums: 'Pódios',
  mainEventPodiumsCaption: 'Jogadores por vezes entre os três primeiros do Main Event',
  mainEventAppearances: 'Participações',
  mainEventAppearancesCaption: 'Jogadores por participações no Main Event',

  // Charts
  pointsProgress: 'Pontos acumulados',
  viewTable: 'Ver dados em tabela',
  legend: 'Legenda',
  wins: 'Vitórias',
  others: 'Outros',
  othersCount: ({ count }: { count: number }) => `Outros: ${count}`,
  winsByPlayer: 'Vitórias por jogador',
  /** `leader` is the nickname of the first player, when there is one. */
  pointsProgressDescription: ({ count, perSeason, leader }: { count: number; perSeason: boolean; leader?: string }) =>
    `Gráfico de linhas: pontos acumulados dos ${count} jogadores com mais pontos, por ${perSeason ? 'temporada' : 'evento'}.${leader ? ` ${leader} lidera.` : ''} Os números estão na tabela abaixo.`,
  pointsProgressCaption: ({ perSeason }: { perSeason: boolean }) => `Pontos acumulados por ${perSeason ? 'temporada' : 'evento'}`,
  /** `top` is the player with most wins, when there is one. */
  winsDescription: ({ top }: { top?: { nickname: string; wins: number } }) =>
    `Gráfico de barras: vitórias por jogador.${top ? ` ${top.nickname} tem mais: ${top.wins}.` : ''} Os números estão na tabela abaixo.`,

  potsPerNight: 'Pote por evento',
  potsPerSeason: 'Pote por temporada',
  /** `top` is the step with the biggest pot, when there is one; its `pot` is already written as money. */
  potsDescription: ({ perSeason, top }: { perSeason: boolean; top?: { label: string; pot: string } }) =>
    `Gráfico de linha: pote por ${perSeason ? 'temporada' : 'evento'}.${top ? ` O maior é ${top.pot}, em ${top.label}.` : ''} Os números estão na tabela abaixo.`,
  /** `top` is the place with most nights, when there is one. */
  placesDescription: ({ top }: { top?: { name: string; count: number } }) =>
    `Gráfico de pizza: eventos por local.${top ? ` ${top.name} tem mais: ${top.count}.` : ''} Os números estão na tabela abaixo.`,

  // One player's charts
  positions: 'Posições',
  /** `total` is the last running total, already formatted, when there is one. */
  playerPointsDescription: ({ nickname, perSeason, total }: { nickname: string; perSeason: boolean; total?: string }) =>
    `Gráfico de linha: pontos acumulados de ${nickname}, por ${perSeason ? 'temporada' : 'evento'}.${total ? ` Chega a ${total}.` : ''} Os números estão na tabela abaixo.`,
  playerPointsCaption: ({ nickname, perSeason }: { nickname: string; perSeason: boolean }) =>
    `Pontos acumulados de ${nickname} por ${perSeason ? 'temporada' : 'evento'}`,
  /** `best` is the most frequent position, when there is one. */
  playerPositionsDescription: ({ nickname, best }: { nickname: string; best?: { label: string; count: number } }) =>
    `Gráfico de barras: vezes em que ${nickname} terminou em cada posição.${best ? ` A mais frequente é ${best.label}: ${best.count}.` : ''} Os números estão na tabela abaixo.`,
  playerPositionsCaption: ({ nickname }: { nickname: string }) => `Vezes em que ${nickname} terminou em cada posição`,
}
