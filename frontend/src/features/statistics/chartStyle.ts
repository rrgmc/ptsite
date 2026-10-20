// Chart text wears the text tokens; only the marks wear the series colors.
export const tick = { fill: 'var(--color-muted)', fontSize: 12 }
export const tooltip = {
  contentStyle: { background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text)' },
  labelStyle: { color: 'var(--color-text)', fontWeight: 700 },
  itemStyle: { color: 'var(--color-text)' },
}
// The lines of a tooltip, highest value first: the order of the lines at that point.
export const highestFirst = (item: { value?: unknown }) => -Number(item.value)


// The cells of the tables under the charts.
export const cell = 'border-b border-border/60 px-2 py-1 text-right tabular'
export const head = 'border-b border-border px-2 py-1 text-right text-xs uppercase text-muted'
