import { useState } from 'react'
import { Form } from 'react-aria-components'
import { Link, useSearchParams } from 'react-router'
import { ApiError } from '@/api/client'
import { useCompletePasswordReset, usePasswordReset } from '@/api/queries'
import { Button } from '@/components/Button'
import { ErrorBox, Loading } from '@/components/Feedback'
import { NewPasswordFields } from '@/components/NewPasswordFields'
import { AuthShell, authLinkClass } from './AuthShell'

/**
 * The screen behind the password link sent by email (docs/specs/accounts-and-roles.md, rule 12): a new password,
 * typed twice. A link that expired or was used offers a new one.
 */
export function ResetPasswordPage() {
  const token = useSearchParams()[0].get('token') ?? ''
  const reset = usePasswordReset(token)
  const complete = useCompletePasswordReset(token)
  const [password, setPassword] = useState('')
  const [repeated, setRepeated] = useState('')
  const [mismatch, setMismatch] = useState(false)
  const error = complete.error instanceof ApiError ? complete.error : null
  // A field marked as wrong stops the form from being sent, so typing in any field clears the messages.
  const typing = (set: (value: string) => void) => (value: string) => {
    set(value)
    setMismatch(false)
    if (complete.isError) complete.reset()
  }

  return (
    <AuthShell title="Nova senha">
      <div className="flex flex-col gap-4 rounded-lg bg-surface p-5 shadow-card">
        <h2 className="font-display text-xl font-bold">Nova senha</h2>
        {complete.isSuccess ? (
          <>
            <p role="status">Senha alterada. Entre com a nova senha.</p>
            <Link to="/login" className="inline-flex min-h-touch items-center justify-center rounded-md bg-primary px-4 font-semibold text-on-primary">Entrar</Link>
          </>
        ) : reset.isPending && token !== '' ? (
          <Loading />
        ) : !reset.data ? (
          <>
            {token === '' ? (
              <p role="alert" className="rounded-md border border-danger bg-danger-soft p-4 text-danger">Este link não é válido. Peça um novo link.</p>
            ) : (
              <ErrorBox error={reset.error} />
            )}
            <Link to="/forgot-password" className={authLinkClass}>Pedir um novo link</Link>
          </>
        ) : (
          <Form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              setMismatch(password !== repeated)
              if (password !== repeated) return complete.reset()
              complete.mutate({ password })
            }}
          >
            <p>Escolha uma nova senha para o usuário <strong>{reset.data.username}</strong>.</p>
            <NewPasswordFields password={password} repeated={repeated} onPasswordChange={typing(setPassword)} onRepeatedChange={typing(setRepeated)} mismatch={mismatch} errorMessage={error?.fieldError('password')} />
            {complete.error && !error?.fieldError('password') && (
              <>
                <ErrorBox error={complete.error} />
                <Link to="/forgot-password" className={authLinkClass}>Pedir um novo link</Link>
              </>
            )}
            <Button type="submit" isPending={complete.isPending} fullWidth>Salvar nova senha</Button>
          </Form>
        )}
      </div>
      {!complete.isSuccess && <Link to="/login" className={`mt-2 ${authLinkClass}`}>Voltar para o login</Link>}
    </AuthShell>
  )
}
