// The frame around every screen: the menu, the header and the footer.
export const layout = {
  /** The menu's entries, by the path they lead to (src/features/layout/navigation.ts). */
  nav: {
    standings: 'Classificação',
    results: 'Resultados',
    calendar: 'Calendário',
    simulator: 'Simulação',
    players: 'Jogadores',
    statistics: 'Estatísticas',
    seasons: 'Temporadas',
    profile: 'Meu perfil',
    admin: 'Administração',
  },

  // AppLayout and NavDrawer
  /** The name of the main navigation bars, for screen readers. */
  mainNav: 'Principal',
  menu: 'Menu',
  /** For screen readers, before the season's name in the header. */
  seasonPrefix: 'Temporada:',

  // SeasonNotice
  seasonNotice: {
    label: 'Temporada selecionada',
    viewing: 'Você está vendo {season}, que não é a temporada atual.',
    backToCurrent: 'Voltar para a atual',
  },

  // ErrorPage
  errorPage: {
    notFoundTitle: 'Página não encontrada',
    notFoundText: 'O endereço não existe.',
    errorTitle: 'Algo deu errado',
    errorText: 'Tente de novo. Se o problema continuar, avise quem cuida do site.',
    toStandings: 'Ir para a classificação',
  },
}
