import type { ReactNode } from 'react'
import { ApiError } from '@/api/client'
import { t } from '@/i18n'

export function Loading({ label = t.common.loading }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-3 p-6 text-muted">
      <span aria-hidden className="size-5 animate-spin rounded-full border-2 border-border border-t-primary" />
      {label}
    </div>
  )
}

export function ErrorBox({ error }: { error: unknown }) {
  const message =
    error instanceof ApiError ? error.body.message : t.components.connectionError
  return (
    <div role="alert" className="rounded-md border border-danger bg-danger-soft p-4 text-danger">
      {message}
    </div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-md border border-dashed border-border p-6 text-center text-muted">{children}</p>
}

export function Badge({ tone = 'neutral', children }: { tone?: 'neutral' | 'primary' | 'warning' | 'danger'; children: ReactNode }) {
  const tones = {
    neutral: 'bg-surface-sunken text-muted',
    primary: 'bg-primary-soft text-primary',
    warning: 'bg-warning-soft text-warning',
    danger: 'bg-danger-soft text-danger',
  }
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>
}
