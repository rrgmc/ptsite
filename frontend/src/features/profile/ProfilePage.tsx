import { useState } from 'react'
import { Form } from 'react-aria-components'
import { ApiError, type Player } from '@/api/client'
import { useChangePassword, useMe, useSavePlayer } from '@/api/queries'
import { Button } from '@/components/Button'
import { Card, PageHeader } from '@/components/Card'
import { Empty, ErrorBox } from '@/components/Feedback'
import { NewPasswordFields } from '@/components/NewPasswordFields'
import { TextField } from '@/components/TextField'
import { t } from '@/i18n'
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
      <PageHeader title={t.profile.title} subtitle={me.data ? t.profile.username({ username: me.data.username }) : undefined} />
      <div className="flex max-w-xl flex-col gap-4">
        {player ? (
          <>
            <Card title={t.profile.myData}>
              <ProfileForm player={player} />
            </Card>
            <Card title={t.profile.myPhoto}>
              <PlayerImagesEditor player={player} />
            </Card>
          </>
        ) : (
          // An account with no player, such as an admin who does not play.
          <Empty>{t.profile.noPlayer}</Empty>
        )}
        <Card title={t.profile.myPassword}>
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
      <TextField label={t.profile.currentPassword} type="password" autoComplete="current-password" value={current} onChange={typing(setCurrent)} isRequired errorMessage={error?.fieldError('current_password')} />
      <NewPasswordFields password={password} repeated={repeated} onPasswordChange={typing(setPassword)} onRepeatedChange={typing(setRepeated)} mismatch={mismatch} errorMessage={error?.fieldError('password')} />
      {change.error && !(error?.body.errors && Object.keys(error.body.errors).length > 0) && <ErrorBox error={change.error} />}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" isPending={change.isPending}>{t.profile.changePassword}</Button>
        {change.isSuccess && <span role="status" className="font-semibold text-success">{t.profile.passwordChanged}</span>}
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
      <TextField label={t.common.nickname} description={t.profile.nicknameHelp} value={nickname} onChange={setNickname} isRequired errorMessage={error?.fieldError('nickname')} />
      <TextField label={t.profile.fullName} value={name} onChange={setName} errorMessage={error?.fieldError('name')} />
      <TextField label={t.profile.email} type="email" description={t.profile.emailHelp} value={email} onChange={setEmail} errorMessage={error?.fieldError('email')} />
      <TextField label={t.profile.birthDate} type="date" description={t.profile.birthDateHelp} value={birthDate} onChange={setBirthDate} errorMessage={error?.fieldError('birth_date')} />
      {save.error && !(error?.body.errors && Object.keys(error.body.errors).length > 0) && <ErrorBox error={save.error} />}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" isPending={save.isPending}>{t.common.save}</Button>
        {save.isSuccess && <span role="status" className="font-semibold text-success">{t.profile.saved}</span>}
      </div>
    </Form>
  )
}
