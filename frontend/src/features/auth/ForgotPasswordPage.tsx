import { useState } from 'react'
import { Form } from 'react-aria-components'
import { Link } from 'react-router'
import { ApiError } from '@/api/client'
import { useRequestPasswordReset } from '@/api/queries'
import { Button } from '@/components/Button'
import { ErrorBox } from '@/components/Feedback'
import { TextField } from '@/components/TextField'
import { AuthShell, authLinkClass } from './AuthShell'

/**
 * "Esqueci minha senha": asks for a password link by email (docs/specs/accounts-and-roles.md, rule 12). The API
 * says when the account has no address that can get a link.
 */
export function ForgotPasswordPage() {
  const request = useRequestPasswordReset()
  const [login, setLogin] = useState('')
  const error = request.error instanceof ApiError ? request.error : null

  return (
    <AuthShell title="Esqueci minha senha">
      <div className="flex flex-col gap-4 rounded-lg bg-surface p-5 shadow-card">
        <h2 className="font-display text-xl font-bold">Esqueci minha senha</h2>
        {request.isSuccess ? (
          <p role="status">
            Enviamos um link para <strong>{request.data.email}</strong>. Ele vale por 60 minutos. Confira também a caixa de spam.
          </p>
        ) : (
          <Form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              request.mutate({ login })
            }}
          >
            <p className="text-muted">Informe o seu usuário ou o seu e-mail. Enviamos um link para você escolher uma nova senha.</p>
            <TextField label="Usuário ou e-mail" name="login" autoComplete="username" value={login} onChange={setLogin} isRequired autoFocus errorMessage={error?.fieldError('login')} />
            {request.error && !error?.fieldError('login') && <ErrorBox error={request.error} />}
            <Button type="submit" isPending={request.isPending} fullWidth>Enviar link</Button>
          </Form>
        )}
      </div>
      <Link to="/login" className={`mt-2 ${authLinkClass}`}>Voltar para o login</Link>
    </AuthShell>
  )
}
