import type { ReactNode } from 'react'
import { ToggleButton, type ToggleButtonProps } from 'react-aria-components'

const selected = {
  /** Something done, such as a payment. */
  done: 'selected:border-primary selected:bg-primary selected:text-on-primary',
  /** Something still to settle, such as a time chip that is owed. */
  owed: 'selected:border-warning selected:bg-warning-soft selected:text-warning',
  /** Something done another way, such as a payment that was not in cash. */
  otherWay: 'selected:border-primary selected:bg-primary-soft selected:text-primary',
}

/** What shows that a chip is on: never the color alone. */
const sign: Record<keyof typeof selected, string> = { done: '✓', owed: '✓', otherWay: '⇄' }

/**
 * A mark that one tap turns on or off. It is compact (36px high), so that a row of them fits a phone. A check mark shows that it is on, so the color is
 * never the only sign; a screen reader says it as a pressed button. The tone "otherWay" has a sign of its own: say
 * what it means in an `aria-label`, for a screen reader.
 */
export function ToggleChip({ tone = 'done', children, ...props }: Omit<ToggleButtonProps, 'children' | 'className'> & { tone?: keyof typeof selected; children: ReactNode }) {
  return (
    <ToggleButton
      {...props}
      className={[
        'inline-flex min-h-9 items-center gap-1 rounded-full border border-border bg-surface px-2.5 text-sm font-semibold transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-60',
        'focus-visible:outline-3 focus-visible:outline-focus focus-visible:outline-offset-2',
        selected[tone],
      ].join(' ')}
    >
      {({ isSelected }) => (
        <>
          {isSelected && <ChipSign tone={tone} />}
          {children}
        </>
      )}
    </ToggleButton>
  )
}

/** The colors of a chip that is on, as in `selected`, for something that is no button. */
const swatch: Record<keyof typeof selected, string> = {
  done: 'border-primary bg-primary text-on-primary',
  owed: 'border-warning bg-warning-soft text-warning',
  otherWay: 'border-primary bg-primary-soft text-primary',
}

/**
 * The sign a chip of this tone has when it is on. A screen reader does not say it. With `swatch`, it is a small
 * chip in the colors of one that is on, for a legend.
 */
export function ChipSign({ tone, swatch: asSwatch = false }: { tone: keyof typeof selected; swatch?: boolean }) {
  return (
    <span aria-hidden className={asSwatch ? `inline-flex h-5 min-w-6 items-center justify-center rounded-full border px-1 text-xs font-semibold ${swatch[tone]}` : undefined}>
      {sign[tone]}
    </span>
  )
}
