import { Button as AriaButton, type ButtonProps as AriaButtonProps } from 'react-aria-components'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover pressed:bg-primary-hover',
  secondary: 'bg-surface text-text border border-border hover:bg-surface-sunken',
  danger: 'bg-danger text-on-primary hover:opacity-90',
  ghost: 'bg-transparent text-primary hover:bg-primary-soft',
}

export interface ButtonProps extends AriaButtonProps {
  variant?: Variant
  fullWidth?: boolean
}

export function Button({ variant = 'primary', fullWidth, className, ...props }: ButtonProps) {
  return (
    <AriaButton
      {...props}
      className={[
        'inline-flex min-h-touch items-center justify-center gap-2 rounded-md px-4 font-semibold transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-50 pending:opacity-70',
        'focus-visible:outline-3 focus-visible:outline-focus focus-visible:outline-offset-2',
        variants[variant],
        fullWidth ? 'w-full' : '',
        typeof className === 'string' ? className : '',
      ].join(' ')}
    />
  )
}
