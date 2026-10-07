import { useState } from 'react'
import { Form } from 'react-aria-components'
import { ApiError, type Player } from '@/api/client'
import { useChangePassword, useMe, useSavePlayer } from '@/api/queries'
import { Button } from '@/components/Button'
import { Card, PageHeader } from '@/components/Card'
import { Empty, ErrorBox } from '@/components/Feedback'
import { NewPasswordFields } from '@/components/NewPasswordFields'
import { TextField } from '@/components/TextField'
import { PlayerImagesEditor } from '@/features/players/PlayerImagesEditor'

/**
 * "Meu perfil": the logged-in player's own details and images (docs/specs/players.md, rule 10), and the
 * account's password (docs/specs/accounts-and-roles.md, rule 11).
 */
export function ProfilePage() {
  const me = useMe()
  const player = me.data?.player

  return (
    <>
      <PageHeader title="Meu perfil" subtitle={me.data ? `Usuário: ${me.data.username}` : undefined} />
      <div className="flex max-w-xl flex-col gap-4">
        {player ? (
          <>
            <Card title="Meus dados">
              <ProfileForm player={player} />
            </Card>
            <Card title="Minha foto">
              <PlayerImagesEditor player={player} />
            </Card>
          </>
        ) : (
          // An account with no player, such as an admin who does not play.
          <Empty>Este acesso não está ligado a um jogador, então só tem a senha.</Empty>
        )}
        <Card title="Minha senha">
          <PasswordForm />
        </Card>
      </div>
    </>
  )
}

function PasswordForm() {
  const change = useChangePassword()
  const [current, setCurrent] = useState('')
  const [password, setPassword] = useState('')
  const [repeated, setRepeated] = useState('')
  const [mismatch, setMismatch] = useState(false)
  const error = change.error instanceof ApiError ? change.error : null
  // A field marked as wrong stops the form from being sent, so typing in any field clears the messages.
  const typing = (set: (value: string) => void) => (value: string) => {
    set(value)
    setMismatch(false)
    if (change.isError) change.reset()
  }

  return (
    <Form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault()
        // Typed twice, so a typing mistake does not lock the player out.
        setMismatch(password !== repeated)
        if (password !== repeated) return change.reset()
        change.mutate({ current_password: current, password }, {
          onSuccess: () => { setCurrent(''); setPassword(''); setRepeated('') },
        })
      }}
    >
      <TextField label="Senha atual" type="password" autoComplete="current-password" value={current} onChange={typing(setCurrent)} isRequired errorMessage={error?.fieldError('current_password')} />
      <NewPasswordFields password={password} repeated={repeated} onPasswordChange={typing(setPassword)} onRepeatedChange={typing(setRepeated)} mismatch={mismatch} errorMessage={error?.fieldError('password')} />
      {change.error && !(error?.body.errors && Object.keys(error.body.errors).length > 0) && <ErrorBox error={change.error} />}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" isPending={change.isPending}>Alterar senha</Button>
        {change.isSuccess && <span role="status" className="font-semibold text-success">Senha alterada.</span>}
      </div>
    </Form>
  )
}

function ProfileForm({ player }: { player: Player }) {
  const save = useSavePlayer()
  const [nickname, setNickname] = useState(player.nickname)
  const [name, setName] = useState(player.name ?? '')
  const [email, setEmail] = useState(player.email ?? '')
  const [birthDate, setBirthDate] = useState(player.birth_date ?? '')
  const error = save.error instanceof ApiError ? save.error : null

  return (
    <Form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault()
        save.mutate({ id: player.id, nickname, name: name || null, email: email || null, birth_date: birthDate || null })
      }}
    >
      <TextField label="Apelido" description="O nome que aparece na classificação e nos resultados." value={nickname} onChange={setNickname} isRequired errorMessage={error?.fieldError('nickname')} />
      <TextField label="Nome completo" value={name} onChange={setName} errorMessage={error?.fieldError('name')} />
      <TextField label="E-mail" type="email" description="Só você e os administradores veem." value={email} onChange={setEmail} errorMessage={error?.fieldError('email')} />
      <TextField label="Data de nascimento" type="date" description="Só você e os administradores veem." value={birthDate} onChange={setBirthDate} errorMessage={error?.fieldError('birth_date')} />
      {save.error && !(error?.body.errors && Object.keys(error.body.errors).length > 0) && <ErrorBox error={save.error} />}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" isPending={save.isPending}>Salvar</Button>
        {save.isSuccess && <span role="status" className="font-semibold text-success">Dados salvos.</span>}
      </div>
    </Form>
  )
}
