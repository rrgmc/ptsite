/** ISO weekdays (1 = Monday … 7 = Sunday), as the API sends them. */
export const WEEKDAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((label, i) => ({ id: i + 1, label }))

export const EVERY_WEEKS = [
  { id: 1, label: 'Toda semana' },
  { id: 2, label: 'A cada 2 semanas' },
  { id: 3, label: 'A cada 3 semanas' },
  { id: 4, label: 'A cada 4 semanas' },
]
