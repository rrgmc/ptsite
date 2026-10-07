import { useState } from 'react'
import {
  FieldError,
  Input,
  Label,
  Text,
  TextField as AriaTextField,
  type TextFieldProps as AriaTextFieldProps,
} from 'react-aria-components'

export interface TextFieldProps extends AriaTextFieldProps {
  label: string
  description?: string
  errorMessage?: string
  placeholder?: string
}

export function TextField({ label, description, errorMessage, placeholder, onChange, ...props }: TextFieldProps) {
  // An error from the server is about the value that was sent. It goes away when the field is typed in again:
  // a field still marked as wrong would stop the browser from sending the form with the corrected value.
  const [dismissed, setDismissed] = useState<string>()
  if (dismissed !== undefined && errorMessage === undefined) setDismissed(undefined)
  const shown = errorMessage === dismissed ? undefined : errorMessage

  return (
    <AriaTextField
      {...props}
      onChange={(value) => {
        if (errorMessage !== undefined) setDismissed(errorMessage)
        onChange?.(value)
      }}
      isInvalid={props.isInvalid ?? Boolean(shown)}
      className="flex flex-col gap-1"
    >
      <Label className="text-sm font-semibold">{label}</Label>
      <Input
        placeholder={placeholder}
        className="min-h-touch w-full min-w-0 rounded-md border border-border bg-surface px-3 text-base invalid:border-danger focus:outline-3 focus:outline-focus"
      />
      {description && <Text slot="description" className="text-sm text-muted">{description}</Text>}
      <FieldError className="text-sm font-medium text-danger">{shown}</FieldError>
    </AriaTextField>
  )
}
