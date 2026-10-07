import { Link } from 'react-router'

export interface ViewOption {
  label: string
  to: string
  current: boolean
}

/** A choice between ways to show one page, such as "Lista" or "Detalhado". Each has its own address, so the choice can be linked to. */
export function ViewSwitch({ label, options }: { label: string; options: ViewOption[] }) {
  return (
    // With very large text the options do not fit side by side on a phone, so they wrap.
    <nav aria-label={label} className="mb-4 flex flex-wrap gap-1 rounded-lg bg-surface p-1 shadow-card sm:max-w-xs">
      {options.map((option) => (
        <Link
          key={option.to}
          to={option.to}
          aria-current={option.current ? 'page' : undefined}
          className={`flex min-h-touch flex-1 items-center justify-center rounded-md px-4 font-semibold ${option.current ? 'bg-primary text-on-primary' : 'text-primary hover:bg-primary-soft'}`}
        >
          {option.label}
        </Link>
      ))}
    </nav>
  )
}
