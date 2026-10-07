import { useState } from 'react'
import { Form } from 'react-aria-components'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { ApiError, type Player, type PlayerDetail } from '@/api/client'
import { usePlayer, usePlayers, useSavePlayer } from '@/api/queries'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Badge, ErrorBox, Loading } from '@/components/Feedback'
import { PlayerPhotoButton } from '@/components/PlayerThumbnail'
import { TextArea } from '@/components/TextArea'
import { TextField } from '@/components/TextField'
import { PlayerImagesEditor } from '@/features/players/PlayerImagesEditor'
import { t } from '@/i18n'
import { fullNameIfDifferent } from '@/lib/format'
import { roleLabels } from '@/lib/roles'
import { PlayerLoginForm } from './PlayerLoginForm'
import { site } from '@/lib/site'

export function PlayersAdmin() {
  const [search, setSearch] = useState('')
  const players = usePlayers({ search: search || undefined, archived: true })
  const save = useSavePlayer()
  const navigate = useNavigate()
  const [archiving, setArchiving] = useState<Player | null>(null)
  const isSaving =(id: number) => save.isPending && save.variables?.id === id

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full sm:w-72"><TextField label={t.common.search} type="search" value={search} onChange={setSearch} /></div>
        <Button onPress={() => navigate('/admin/players/new')}>{t.admin.players.newPlayer}</Button>
      </div>
      {save.error && <ErrorBox error={save.error} />}
      {players.isPending ? (
        <Loading />
      ) : (
        <Card>
          <ul className="divide-y divide-border/60">
            {players.data!.map((p) => (
              <li key={p.id} className="flex min-h-touch items-center gap-3 px-2 py-1 even:bg-surface-stripe">
                {/* From 640px wide. With large text, a phone row has no room for it next to "Editar". */}
                <span className="hidden shrink-0 sm:flex"><PlayerPhotoButton player={p} /></span>
                <span className="min-w-0 flex-1 wrap-break-word">
                  <span className="flex flex-wrap items-center gap-x-2">
                    <span className={`font-semibold ${p.archived ? 'text-muted line-through' : ''}`}>{p.nickname}</span>
                    {p.archived ? <Badge tone="danger">{t.common.archived}</Badge> : p.status === 'inactive' && <Badge>{t.common.inactive}</Badge>}
                    {p.login && p.login.role !== 'player' && <Badge tone="primary">{roleLabels[p.login.role].toLocaleLowerCase(site.locale)}</Badge>}
                  </span>
                  {fullNameIfDifferent(p.nickname, p.name) && <span className="block text-sm text-muted">{p.name}</span>}
                </span>
                <span className="flex shrink-0 items-center">
                  {/* From 640px wide, the status buttons of the player's page are also here. A phone row has no room for them. */}
                  <span className="hidden sm:flex">
                    {!p.archived && (
                      <Button
                        variant="ghost"
                        className="px-3"
                        isPending={isSaving(p.id)}
                        onPress={() => save.mutate({ id: p.id, status: p.status === 'active' ? 'inactive' : 'active' })}
                        aria-label={p.status === 'active' ? t.admin.deactivateItem({ name: p.nickname }) : t.admin.activateItem({ name: p.nickname })}
                      >
                        {p.status === 'active' ? t.common.deactivate : t.common.activate}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      className="px-3"
                      isPending={isSaving(p.id)}
                      onPress={() => (p.archived ? save.mutate({ id: p.id, archived: false }) : setArchiving(p))}
                      aria-label={p.archived ? t.admin.restoreItem({ name: p.nickname }) : t.admin.archiveItem({ name: p.nickname })}
                    >
                      {p.archived ? t.common.restore : t.common.archive}
                    </Button>
                  </span>
                  <Button variant="ghost" className="px-3" onPress={() => navigate(`/admin/players/${p.id}`)} aria-label={t.admin.editItem({ name: p.nickname })}>{t.common.edit}</Button>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {archiving && (
        <ArchivePlayerDialog
          nickname={archiving.nickname}
          onClose={() => setArchiving(null)}
          isPending={save.isPending}
          onConfirm={() => save.mutate({ id: archiving.id, archived: true }, { onSettled: () => setArchiving(null) })}
        />
      )}
    </div>
  )
}

/** Asks before a player is archived. Restoring hides nothing, so it takes effect at once. */
function ArchivePlayerDialog({ nickname, onClose, onConfirm, isPending }: { nickname: string; onClose: () => void; onConfirm: () => void; isPending: boolean }) {
  return (
    <ConfirmDialog isOpen onOpenChange={onClose} title={t.admin.archiveConfirmTitle({ name: nickname })} confirmLabel={t.common.archive} confirmVariant="danger" isPending={isPending} onConfirm={onConfirm}>
      {t.admin.players.archiveConfirmBody}
    </ConfirmDialog>
  )
}

/** A player's own page in "Administração": /admin/players/new or /admin/players/:playerId. */
export function PlayerEditPage() {
  const { playerId } = useParams()
  const id = playerId === 'new' ? undefined : Number(playerId)
  const player = usePlayer(id)
  const navigate = useNavigate()
  const location = useLocation()
  // Back to the list where it was left, or to the list itself when this page was opened directly.
  const back = () => (location.key !== 'default' ? navigate(-1) : navigate('/admin/players'))

  return (
    <div className="flex flex-col gap-3">
      <Link to="/admin/players" className="inline-flex min-h-touch items-center self-start font-semibold text-primary">{t.admin.players.back}</Link>
      {id === undefined ? (
        <PlayerForm player={null} onDone={back} />
      ) : player.isPending ? (
        <Loading />
      ) : player.error ? (
        <ErrorBox error={player.error} />
      ) : (
        <PlayerForm key={player.data!.id} player={player.data!} onDone={back} />
      )}
    </div>
  )
}

function PlayerForm({ player, onDone }: { player: PlayerDetail | null; onDone: () => void }) {
  const save = useSavePlayer()
  const [nickname, setNickname] = useState(player?.nickname ?? '')
  const [name, setName] = useState(player?.name ?? '')
  const [email, setEmail] = useState(player?.email ?? '')
  const [birthDate, setBirthDate] = useState(player?.birth_date ?? '')
  const [memo, setMemo] = useState(player?.memo ?? '')
  const [archiving, setArchiving] = useState(false)
  const error = save.error instanceof ApiError ? save.error : null

  return (
    <Card
      title={player ? t.admin.editItem({ name: player.nickname }) : t.admin.players.newTitle}
      action={player && <Link to={`/players/${player.id}`} className="inline-flex min-h-touch items-center font-semibold text-primary underline">{t.admin.players.viewPage}</Link>}
    >
      <Form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          save.mutate({ id: player?.id, nickname, name: name || null, email: email || null, birth_date: birthDate || null, memo: memo || null }, { onSuccess: onDone })
        }}
      >
        <TextField label={t.common.nickname} value={nickname} onChange={setNickname} isRequired errorMessage={error?.fieldError('nickname')} />
        <TextField label={t.admin.players.fullName} value={name} onChange={setName} errorMessage={error?.fieldError('name')} />
        <TextField label={t.admin.players.email} type="email" value={email} onChange={setEmail} errorMessage={error?.fieldError('email')} />
        <TextField label={t.admin.players.birthDate} type="date" value={birthDate} onChange={setBirthDate} errorMessage={error?.fieldError('birth_date')} />
        <TextArea
          label={t.admin.players.memo}
          description={t.admin.players.memoHelp}
          value={memo}
          onChange={setMemo}
          maxLength={2000}
          errorMessage={error?.fieldError('memo')}
        />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" isPending={save.isPending}>{t.common.save}</Button>
          <Button variant="ghost" onPress={onDone}>{t.common.cancel}</Button>
        </div>
      </Form>
      {/* Errors that belong to no field, such as from the status buttons below. */}
      {save.error && !(error?.body.errors && Object.keys(error.body.errors).length > 0) && <div className="mt-3"><ErrorBox error={save.error} /></div>}
      {player && (
        // Status changes don't need "Salvar": they take effect at once. Archiving asks first.
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <span className="text-sm text-muted">
            {player.archived ? t.admin.players.statusArchived : player.status === 'active' ? t.admin.players.statusActive : t.admin.players.statusInactive}
          </span>
          {!player.archived && (
            <Button variant="secondary" onPress={() => save.mutate({ id: player.id, status: player.status === 'active' ? 'inactive' : 'active' }, { onSuccess: onDone })}>
              {player.status === 'active' ? t.common.deactivate : t.common.activate}
            </Button>
          )}
          <Button variant="secondary" onPress={() => (player.archived ? save.mutate({ id: player.id, archived: false }, { onSuccess: onDone }) : setArchiving(true))}>
            {player.archived ? t.common.restore : t.common.archive}
          </Button>
        </div>
      )}
      {player && archiving && (
        <ArchivePlayerDialog
          nickname={player.nickname}
          onClose={() => setArchiving(false)}
          isPending={save.isPending}
          onConfirm={() => save.mutate({ id: player.id, archived: true }, { onSuccess: onDone, onSettled: () => setArchiving(false) })}
        />
      )}
      {player && (
        <section aria-labelledby="player-images" className="mt-4 border-t border-border pt-3">
          <h3 id="player-images" className="mb-2 font-bold">{t.admin.players.photo}</h3>
          <PlayerImagesEditor player={player} />
        </section>
      )}
      {player && <PlayerLoginForm key={player.id} player={player} />}
    </Card>
  )
}
