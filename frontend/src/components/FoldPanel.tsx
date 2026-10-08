import type { ReactNode } from 'react'

/**
 * A titled box that folds: its title shows or hides what is under it. It starts open.
 * It may be narrower than its content (min-w-0), as a Card.
 */
export function FoldPanel({ title, children, defaultOpen = true }: { title: ReactNode; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="group min-w-0 rounded-lg bg-surface shadow-card">
      <summary className="flex min-h-touch cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-4 py-3 focus-visible:outline-3 focus-visible:outline-focus [&::-webkit-details-marker]:hidden">
        <h2 className="font-display text-lg font-bold">{title}</h2>
        {/* Points right when folded and down when open. */}
        <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-90">
          <path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <div className="px-4 pb-4">{children}</div>
    </details>
  )
}
