import { t } from '@/i18n'
import { TextField } from './TextField'

interface NewPasswordFieldsProps {
  password: string
  repeated: string
  onPasswordChange: (value: string) => void
  onRepeatedChange: (value: string) => void
  /** The two values were sent and differ. */
  mismatch: boolean
  /** The API's message about the new password. */
  errorMessage?: string
}

/** A new password, typed twice, so a typing mistake does not lock the user out. */
export function NewPasswordFields({ password, repeated, onPasswordChange, onRepeatedChange, mismatch, errorMessage }: NewPasswordFieldsProps) {
  return (
    <>
      <TextField label={t.components.newPassword.label} type="password" autoComplete="new-password" description={t.components.newPassword.hint} value={password} onChange={onPasswordChange} isRequired errorMessage={errorMessage} />
      <TextField label={t.components.newPassword.repeatLabel} type="password" autoComplete="new-password" value={repeated} onChange={onRepeatedChange} isRequired errorMessage={mismatch ? t.components.newPassword.mismatch : undefined} />
    </>
  )
}
