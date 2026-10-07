const medal = ['text-gold', 'text-silver', 'text-bronze']

/** The color of a position in a ranked list: a medal for the first three. */
export const rankColor = (rank: number) => medal[rank - 1] ?? 'text-muted'
