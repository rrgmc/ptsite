import { Checkbox as AriaCheckbox, type CheckboxProps } from 'react-aria-components'

export function Checkbox({ children, ...props }: CheckboxProps & { children: React.ReactNode }) {
  return (
    <AriaCheckbox {...props} className="group flex min-h-touch cursor-pointer items-center gap-3">
      <span
        aria-hidden
        className="flex size-6 items-center justify-center rounded-sm border-2 border-border bg-surface group-selected:border-primary group-selected:bg-primary group-focus-visible:outline-3 group-focus-visible:outline-focus"
      >
        <svg viewBox="0 0 18 18" className="hidden size-4 fill-none stroke-on-primary stroke-3 group-selected:block">
          <polyline points="2 9 7 14 16 4" />
        </svg>
      </span>
      {children}
    </AriaCheckbox>
  )
}
