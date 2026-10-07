// "Simulação": what-if standings for the next night.
export const simulator = {
  title: 'Simulação',
  subtitle: ({ season }: { season: string }) => `E se o próximo evento terminar assim? · ${season}`,
  noSeason: 'Nenhuma temporada cadastrada.',

  // The form
  potLabel: ({ currency }: { currency: string }) => `Pote imaginado (${currency})`,
  /** An example amount, in the site's number format. */
  potExample: '840,00',
  positionLabel: ({ position, percent }: { position: string; percent: number }) => `${position} lugar · ${percent}%`,
  simulate: 'Simular',
  nothingSaved: 'Nada é salvo.',

  // The result
  resultTitle: 'Classificação simulada',
  resultEmpty: 'Escolha o pote e a ordem de chegada para ver como ficaria a classificação.',
  simulated: 'Simulado',
  newEntry: 'novo',
  newEntryTitle: 'Entraria na classificação',
  /** For screen readers, next to the arrow of a player who moves up or down. */
  movesUp: 'sobe',
  movesDown: 'desce',
}
