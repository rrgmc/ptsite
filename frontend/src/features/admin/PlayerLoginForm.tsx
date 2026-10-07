import { useState } from 'react'
import { Form } from 'react-aria-components'
import { ApiError, type Player } from '@/api/client'
import { useMe, useSavePlayerLogin } from '@/api/queries'
import { Button } from '@/components/Button'
import { ErrorBox } from '@/components/Feedback'
import { Select } from '@/components/Select'
import { TextField } from '@/components/TextField'
import { type Role, roleLabels } from '@/lib/roles'
import { site } from '@/lib/site'

const roleOptions = (Object.keys(roleLabels) as Role[]).map((id) => ({ id, label: roleLabels[id] }))

/** "Acesso ao site" on a player's admin screen: create the player's login, change its role, set a new password. */
export function PlayerLoginForm({ player }: { player: Player }) {
  const me = useMe()
  const save = useSavePlayerLogin()
  const login = save.data?.login ?? player.login ?? null
  const own = me.data?.player?.id === player.id
  const [username, setUsername] = useState(player.nickname.toLocaleLowerCase(site.locale).replace(/\s+/g, ''))
  const [role, setRole] = useState<Role>(login?.role ?? 'player')
  const [password, setPassword] = useState('')
  const error = save.error instanceof ApiError ? save.error : null
  const fieldErrors = error?.body.errors && Object.keys(error.body.errors).length > 0

  return (
    <section aria-labelledby={`login-${player.id}`} className="mt-4 border-t border-border pt-3">
      <h3 id={`login-${player.id}`} className="mb-2 font-semibold">Acesso ao site</h3>
      {login ? (
        <p className="mb-3 text-sm text-muted">Usuário <span className="font-semibold text-text">{login.username}</span></p>
      ) : (
        <p className="mb-3 text-sm text-muted">Sem acesso ao site. Crie um usuário e uma senha para este jogador.</p>
      )}
      <Form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          save.mutate(
            {
              playerId: player.id,
              ...(login ? {} : { username }),
              ...(!own && role !== login?.role ? { role } : {}),
              ...(password ? { password } : {}),
            },
            { onSuccess: () => setPassword('') },
          )
        }}
      >
        {!login && <TextField label="Usuário" value={username} onChange={setUsername} isRequired autoComplete="off" errorMessage={error?.fieldError('username')} />}
        {own ? (
          <p className="text-sm text-muted">Papel: {roleLabels[login?.role ?? 'player']}. Você não pode mudar o seu próprio papel.</p>
        ) : (
          <Select label="Papel" options={roleOptions} selectedKey={role} onSelectionChange={(key) => key && setRole(key as Role)} />
        )}
        <TextField
          label={login ? 'Nova senha' : 'Senha'}
          description={login ? 'Deixe em branco para manter a senha atual.' : 'Pelo menos 8 caracteres.'}
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          isRequired={!login}
          errorMessage={error?.fieldError('password')}
        />
        {error?.fieldError('role') && <p role="alert" className="text-sm font-medium text-danger">{error.fieldError('role')}</p>}
        {save.error && !fieldErrors && <ErrorBox error={save.error} />}
        {save.isSuccess && !save.isPending && <p role="status" className="text-sm font-semibold text-success">Acesso salvo.</p>}
        <div>
          <Button type="submit" variant="secondary" isPending={save.isPending}>{login ? 'Salvar acesso' : 'Criar acesso'}</Button>
        </div>
      </Form>
    </section>
  )
}
