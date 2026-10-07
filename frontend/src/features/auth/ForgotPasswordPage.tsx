import { useState } from 'react'
import { Form } from 'react-aria-components'
import { Link } from 'react-router'
import { ApiError } from '@/api/client'
import { useRequestPasswordReset } from '@/api/queries'
import { Button } from '@/components/Button'
import { ErrorBox } from '@/components/Feedback'
import { TextField } from '@/components/TextField'
import { t } from '@/i18n'
import { rich } from '@/i18n/rich'
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
    <AuthShell title={t.auth.forgotPassword}>
      <div className="flex flex-col gap-4 rounded-lg bg-surface p-5 shadow-card">
        <h2 className="font-display text-xl font-bold">{t.auth.forgotPassword}</h2>
        {request.isSuccess ? (
          <p role="status">
            {rich(t.auth.forgot.sent, { email: <strong>{request.data.email}</strong> })}
          </p>
        ) : (
          <Form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              request.mutate({ login })
            }}
          >
            <p className="text-muted">{t.auth.forgot.intro}</p>
            <TextField label={t.auth.forgot.loginLabel} name="login" autoComplete="username" value={login} onChange={setLogin} isRequired autoFocus errorMessage={error?.fieldError('login')} />
            {request.error && !error?.fieldError('login') && <ErrorBox error={request.error} />}
            <Button type="submit" isPending={request.isPending} fullWidth>{t.auth.forgot.sendLink}</Button>
          </Form>
        )}
      </div>
      <Link to="/login" className={`mt-2 ${authLinkClass}`}>{t.auth.forgot.backToLogin}</Link>
    </AuthShell>
  )
}
