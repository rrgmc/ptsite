import { useState } from 'react'
import { Form } from 'react-aria-components'
import { Link, useSearchParams } from 'react-router'
import { ApiError } from '@/api/client'
import { useCompletePasswordReset, usePasswordReset } from '@/api/queries'
import { Button } from '@/components/Button'
import { ErrorBox, Loading } from '@/components/Feedback'
import { NewPasswordFields } from '@/components/NewPasswordFields'
import { t } from '@/i18n'
import { rich } from '@/i18n/rich'
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
    <AuthShell title={t.auth.reset.title}>
      <div className="flex flex-col gap-4 rounded-lg bg-surface p-5 shadow-card">
        <h2 className="font-display text-xl font-bold">{t.auth.reset.title}</h2>
        {complete.isSuccess ? (
          <>
            <p role="status">{t.auth.reset.done}</p>
            <Link to="/login" className="inline-flex min-h-touch items-center justify-center rounded-md bg-primary px-4 font-semibold text-on-primary">{t.auth.logIn}</Link>
          </>
        ) : reset.isPending && token !== '' ? (
          <Loading />
        ) : !reset.data ? (
          <>
            {token === '' ? (
              <p role="alert" className="rounded-md border border-danger bg-danger-soft p-4 text-danger">{t.auth.reset.invalidLink}</p>
            ) : (
              <ErrorBox error={reset.error} />
            )}
            <Link to="/forgot-password" className={authLinkClass}>{t.auth.reset.requestNewLink}</Link>
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
            <p>{rich(t.auth.reset.choose, { username: <strong>{reset.data.username}</strong> })}</p>
            <NewPasswordFields password={password} repeated={repeated} onPasswordChange={typing(setPassword)} onRepeatedChange={typing(setRepeated)} mismatch={mismatch} errorMessage={error?.fieldError('password')} />
            {complete.error && !error?.fieldError('password') && (
              <>
                <ErrorBox error={complete.error} />
                <Link to="/forgot-password" className={authLinkClass}>{t.auth.reset.requestNewLink}</Link>
              </>
            )}
            <Button type="submit" isPending={complete.isPending} fullWidth>{t.auth.reset.save}</Button>
          </Form>
        )}
      </div>
      {!complete.isSuccess && <Link to="/login" className={`mt-2 ${authLinkClass}`}>{t.auth.forgot.backToLogin}</Link>}
    </AuthShell>
  )
}
