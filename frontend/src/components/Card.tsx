import type { ReactNode } from 'react'
import { usePageTitle } from '@/lib/usePageTitle'

/** A titled box. It may be narrower than its content (min-w-0), so a wide table inside scrolls instead of widening the page. */
export function Card({ title, action, children, className = '' }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 rounded-lg bg-surface p-4 shadow-card ${className}`}>
      {(title || action) && (
        <header className="mb-3 flex flex-wrap items-center justify-between gap-3">
          {title && <h2 className="font-display text-lg font-bold">{title}</h2>}
          {action}
        </header>
      )}
      {children}
    </section>
  )
}

/** The heading of a screen. Its title is also the screen's name in the browser title. */
export function PageHeader({ title, subtitle, action }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  usePageTitle(typeof title === 'string' ? title : undefined)
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0 wrap-anywhere">
        <h1 className="font-display text-2xl font-extrabold hyphens-auto">{title}</h1>
        {subtitle && <p className="text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
