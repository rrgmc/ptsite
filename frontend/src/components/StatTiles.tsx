export interface StatTile {
  label: string
  value: string | number
}

/** A row of numbers with their labels: two across on a phone, more on wider screens. */
export function StatTiles({ tiles }: { tiles: StatTile[] }) {
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {tiles.map((tile) => (
        <div key={tile.label} className="flex min-w-0 flex-col-reverse rounded-lg bg-surface p-3 shadow-card">
          <dt className="text-xs uppercase text-muted wrap-anywhere">{tile.label}</dt>
          <dd className="font-display text-2xl font-bold tabular wrap-anywhere">{tile.value}</dd>
        </div>
      ))}
    </dl>
  )
}
