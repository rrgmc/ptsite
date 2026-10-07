import {
  Button,
  FieldError,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Select as AriaSelect,
  SelectValue,
  type Key,
} from 'react-aria-components'
import { t } from '@/i18n'

export interface SelectOption {
  id: Key
  label: string
}

export function Select({
  label,
  options,
  selectedKey,
  onSelectionChange,
  placeholder = t.common.select,
  errorMessage,
}: {
  label: string
  options: SelectOption[]
  selectedKey: Key | null
  onSelectionChange: (key: Key | null) => void
  placeholder?: string
  errorMessage?: string
}) {
  return (
    <AriaSelect
      selectedKey={selectedKey}
      onSelectionChange={onSelectionChange}
      placeholder={placeholder}
      isInvalid={Boolean(errorMessage)}
      className="flex flex-col gap-1"
    >
      <Label className="text-sm font-semibold">{label}</Label>
      <Button className="flex min-h-touch items-center justify-between rounded-md border border-border bg-surface px-3 text-left">
        <SelectValue className="min-w-0 truncate placeholder-shown:text-muted" />
        <span aria-hidden className="text-muted">▾</span>
      </Button>
      <FieldError className="text-sm font-medium text-danger">{errorMessage}</FieldError>
      <Popover className="w-(--trigger-width) rounded-md border border-border bg-surface shadow-raised">
        <ListBox items={options} className="max-h-72 overflow-auto p-1 outline-none">
          {(item) => (
            <ListBoxItem
              id={item.id}
              className="flex min-h-touch cursor-pointer items-center rounded-sm px-3 outline-none focus:bg-primary-soft selected:font-semibold"
            >
              {item.label}
            </ListBoxItem>
          )}
        </ListBox>
      </Popover>
    </AriaSelect>
  )
}
