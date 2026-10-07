import { useState } from 'react'
import {
  FieldError,
  Label,
  Text,
  TextArea as AriaTextArea,
  TextField as AriaTextField,
  type TextFieldProps as AriaTextFieldProps,
} from 'react-aria-components'

export interface TextAreaProps extends AriaTextFieldProps {
  label: string
  description?: string
  errorMessage?: string
  rows?: number
}

/** A text field of several lines. It behaves as {@link TextField} does. */
export function TextArea({ label, description, errorMessage, rows = 4, onChange, ...props }: TextAreaProps) {
  // As in TextField: an error from the server goes away when the field is typed in again.
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
      <AriaTextArea
        rows={rows}
        className="min-h-touch w-full min-w-0 rounded-md border border-border bg-surface px-3 py-2 text-base invalid:border-danger focus:outline-3 focus:outline-focus"
      />
      {description && <Text slot="description" className="text-sm text-muted">{description}</Text>}
      <FieldError className="text-sm font-medium text-danger">{shown}</FieldError>
    </AriaTextField>
  )
}
