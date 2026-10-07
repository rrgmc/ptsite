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
      <TextField label="Nova senha" type="password" autoComplete="new-password" description="Pelo menos 8 caracteres." value={password} onChange={onPasswordChange} isRequired errorMessage={errorMessage} />
      <TextField label="Repetir a nova senha" type="password" autoComplete="new-password" value={repeated} onChange={onRepeatedChange} isRequired errorMessage={mismatch ? 'As duas senhas não são iguais.' : undefined} />
    </>
  )
}
