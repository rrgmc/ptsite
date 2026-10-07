import { useState } from 'react'
import { useSearchParams } from 'react-router'
import type { PlayerDetail } from '@/api/client'
import { usePlayers } from '@/api/queries'
import { Card, PageHeader } from '@/components/Card'
import { Badge, Empty, ErrorBox, Loading } from '@/components/Feedback'
import { PlayerLink } from '@/components/PlayerLink'
import { PlayerPhotoButton, PlayerThumbnail } from '@/components/PlayerThumbnail'
import { TextField } from '@/components/TextField'
import { ViewSwitch } from '@/components/ViewSwitch'
import { t } from '@/i18n'
import { fullNameIfDifferent } from '@/lib/format'
import { playerImageUrl } from '@/lib/playerImages'

/** The players, as a list of everyone ("Lista") or as the photo and memo of those who have a memo ("Detalhado"). */
export function PlayersPage() {
  const [search, setSearch] = useState('')
  const [params] = useSearchParams()
  const detailed = params.get('view') === 'detailed'
  const players = usePlayers({ search: search || undefined })
  const withMemo = players.data?.filter((p) => p.memo?.trim()) ?? []

  return (
    <>
      <PageHeader title={t.common.players} subtitle={t.players.listSubtitle} />
      <ViewSwitch
        label={t.players.viewLabel}
        options={[
          { label: t.players.viewList, to: '/players', current: !detailed },
          { label: t.players.viewDetailed, to: '/players?view=detailed', current: detailed },
        ]}
      />
      <div className="mb-4 max-w-sm">
        <TextField label={t.common.search} type="search" value={search} onChange={setSearch} placeholder={t.players.searchPlaceholder} />
      </div>
      {players.isPending ? (
        <Loading />
      ) : players.error ? (
        <ErrorBox error={players.error} />
      ) : detailed ? (
        withMemo.length === 0 ? (
          <Empty>{t.players.noneWithMemo}</Empty>
        ) : (
          <ul className="flex flex-col gap-4">
            {withMemo.map((p) => (
              <li key={p.id} id={`p${p.id}`}>
                <PlayerMemoCard player={p} />
              </li>
            ))}
          </ul>
        )
      ) : players.data!.length === 0 ? (
        <Empty>{t.players.noneFound}</Empty>
      ) : (
        <Card>
          <ul className="grid grid-cols-1 gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
            {players.data!.map((p) => (
              <li key={p.id} id={`p${p.id}`} className="flex min-h-touch items-center gap-3 border-b border-border/60 py-2">
                <PlayerPhotoButton player={p} />
                <span className="min-w-0 flex-1 wrap-break-word">
                  <PlayerLink player={p} />
                  {fullNameIfDifferent(p.nickname, p.name) && <span className="block text-sm text-muted">{p.name}</span>}
                </span>
                {p.status === 'inactive' && <Badge>{t.common.inactive}</Badge>}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  )
}

/** One player in the detailed view: the photo, the nickname and the memo. */
function PlayerMemoCard({ player }: { player: PlayerDetail }) {
  const photo = playerImageUrl(player, 'photo') ?? playerImageUrl(player, 'thumbnail')

  return (
    <Card>
      {/* At phone width the memo goes below the photo, to use the whole width. From `sm` up it is beside it. */}
      <div className="grid grid-cols-[auto_1fr] items-start gap-x-4 gap-y-3 sm:grid-rows-[auto_1fr] sm:gap-y-2">
        <div className="sm:row-span-2">
          {/* The nickname is next to it, so screen readers skip the photo. */}
          {photo ? (
            <img src={photo} alt="" loading="lazy" className="w-24 rounded-md bg-surface-sunken" />
          ) : (
            <PlayerThumbnail player={player} size="lg" />
          )}
        </div>
        <h2 className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-lg wrap-break-word">
          <PlayerLink player={player} />
          {player.status === 'inactive' && <Badge>{t.common.inactive}</Badge>}
        </h2>
        {/* Plain text, as typed: line breaks are kept and nothing in it becomes a link. */}
        <p className="col-span-2 min-w-0 whitespace-pre-line wrap-anywhere sm:col-span-1 sm:col-start-2">{player.memo}</p>
      </div>
    </Card>
  )
}
