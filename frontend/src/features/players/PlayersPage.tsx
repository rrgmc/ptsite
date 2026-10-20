import { useState } from 'react'
import { useSearchParams } from 'react-router'
import type { PlayerDetail } from '@/api/client'
import { usePlayers, useStatistics } from '@/api/queries'
import { Button } from '@/components/Button'
import { Card, PageHeader } from '@/components/Card'
import { Badge, Empty, ErrorBox, Loading } from '@/components/Feedback'
import { PlayerLink } from '@/components/PlayerLink'
import { PlayerPhotoButton, PlayerThumbnail } from '@/components/PlayerThumbnail'
import { TextField } from '@/components/TextField'
import { ViewSwitch } from '@/components/ViewSwitch'
import { t } from '@/i18n'
import { fullNameIfDifferent } from '@/lib/format'
import { playerImageUrl } from '@/lib/playerImages'
import { byPositionTable } from './positionOrder'

/**
 * The players, as a list of everyone ("Lista") or as the photo and memo of those who have a memo ("Detalhado").
 * "Detalhado" also has the inactive and archived players who have a memo, follows "Posições" over every season,
 * and starts with a button for each player, which scrolls to the player's card.
 */
export function PlayersPage() {
  const [search, setSearch] = useState('')
  const [params] = useSearchParams()
  const detailed = params.get('view') === 'detailed'
  const players = usePlayers({ search: search || undefined, withMemo: detailed || undefined })
  // Only "Detalhado" needs the statistics.
  const statistics = useStatistics(detailed ? null : undefined)
  const withMemo = byPositionTable(players.data?.filter((p) => p.memo?.trim()) ?? [], statistics.data?.position_table ?? [])
  const pending = players.isPending || (detailed && statistics.isPending)
  const error = players.error ?? (detailed ? statistics.error : null)

  return (
    <>
      <PageHeader title={t.common.players} subtitle={detailed ? t.players.detailedSubtitle : t.players.listSubtitle} />
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
      {pending ? (
        <Loading />
      ) : error ? (
        <ErrorBox error={error} />
      ) : detailed ? (
        withMemo.length === 0 ? (
          <Empty>{t.players.noneWithMemo}</Empty>
        ) : (
          <>
            <PlayerJumpList players={withMemo} />
            <ul className="flex flex-col gap-4">
              {withMemo.map((p) => (
                <li key={p.id} id={`p${p.id}`} tabIndex={-1} className="scroll-mt-28 rounded-lg outline-none">
                  <PlayerMemoCard player={p} />
                </li>
              ))}
            </ul>
          </>
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

/** A button for each player of the detailed view, in the same order, so reaching a player needs no scrolling. */
function PlayerJumpList({ players }: { players: PlayerDetail[] }) {
  // Scrolls to the card and moves the focus to it, so the keyboard and screen readers follow.
  const jump = (player: PlayerDetail) => {
    const card = document.getElementById(`p${player.id}`)
    if (!card) return
    card.focus({ preventScroll: true })
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    card.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' })
  }

  return (
    <nav aria-label={t.players.jumpLabel} className="mb-4">
      <ul className="flex flex-wrap gap-2">
        {players.map((p) => (
          <li key={p.id}>
            <Button variant="ghost" className="border border-border px-3" onPress={() => jump(p)}>
              {p.nickname}
            </Button>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/** One player in the detailed view: the photo with the full name under it, the nickname and the memo. */
function PlayerMemoCard({ player }: { player: PlayerDetail }) {
  const photo = playerImageUrl(player, 'photo') ?? playerImageUrl(player, 'thumbnail')
  const name = fullNameIfDifferent(player.nickname, player.name)

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
          {/* As under the nickname on the player's page. */}
          {name && <p className="mt-1 w-24 text-muted wrap-break-word">{name}</p>}
        </div>
        <h2 className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-lg wrap-break-word">
          <PlayerLink player={player} />
          {player.archived ? <Badge tone="danger">{t.common.archived}</Badge> : player.status === 'inactive' && <Badge>{t.common.inactive}</Badge>}
        </h2>
        {/* Plain text, as typed: line breaks are kept and nothing in it becomes a link. */}
        <p className="col-span-2 min-w-0 whitespace-pre-line wrap-anywhere sm:col-span-1 sm:col-start-2">{player.memo}</p>
      </div>
    </Card>
  )
}
