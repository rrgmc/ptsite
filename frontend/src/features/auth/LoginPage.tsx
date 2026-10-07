import { useState } from 'react'
import { Form } from 'react-aria-components'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { ApiError } from '@/api/client'
import { useLogin, useMe } from '@/api/queries'
import { Button } from '@/components/Button'
import { Checkbox } from '@/components/Checkbox'
import { TextField } from '@/components/TextField'
import { AuthShell, authLinkClass } from './AuthShell'

export function LoginPage() {
  const me = useMe()
  const login = useLogin()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)

  if (me.data) return <Navigate to={(location.state as { from?: string } | null)?.from ?? '/'} replace />

  const error = login.error instanceof ApiError ? login.error.fieldError('username') ?? login.error.body.message : undefined

  return (
    <AuthShell title="Entrar">
      <Form
        className="flex flex-col gap-4 rounded-lg bg-surface p-5 shadow-card"
        onSubmit={(e) => {
          e.preventDefault()
          login.mutate({ username, password, remember }, { onSuccess: () => navigate('/', { replace: true }) })
        }}
      >
        <TextField label="Usuário" name="username" autoComplete="username" value={username} onChange={setUsername} isRequired autoFocus />
        <TextField label="Senha" name="password" type="password" autoComplete="current-password" value={password} onChange={setPassword} isRequired />
        <Checkbox isSelected={remember} onChange={setRemember}>Manter conectado por 30 dias</Checkbox>
        {error && <p role="alert" className="rounded-md bg-danger-soft p-3 text-danger">{error}</p>}
        <Button type="submit" isPending={login.isPending} fullWidth>Entrar</Button>
      </Form>
      <Link to="/forgot-password" className={`mt-2 ${authLinkClass}`}>Esqueci minha senha</Link>
    </AuthShell>
  )
}
