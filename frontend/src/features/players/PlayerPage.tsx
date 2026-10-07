import { lazy, type ReactNode, Suspense } from 'react'
import { Link, useParams } from 'react-router'
import type { PlayerDetail, PlayerStatistics } from '@/api/client'
import { useMe, usePlayer, usePlayerStatistics } from '@/api/queries'
import { Card, PageHeader } from '@/components/Card'
import { Badge, Empty, ErrorBox, Loading } from '@/components/Feedback'
import { PeriodSwitch } from '@/components/PeriodSwitch'
import { PlayerThumbnail } from '@/components/PlayerThumbnail'
import { StatTiles } from '@/components/StatTiles'
import { t } from '@/i18n'
import { formatDate, formatPoints, fullNameIfDifferent, nightTitle, ordinal } from '@/lib/format'
import { playerImageUrl } from '@/lib/playerImages'
import { useSelectedSeason } from '../layout/useSelectedSeason'

// The charts load apart from the page, so the chart library stays out of the main bundle.
const PlayerCharts = lazy(() => import('../statistics/PlayerCharts').then((m) => ({ default: m.PlayerCharts })))

const link = 'font-semibold text-primary underline'
const action = `inline-flex min-h-touch items-center ${link}`

/** A player's page, with the statistics of the selected season (docs/specs/players.md, rule 11). */
export function PlayerPage() {
  const { season, isPending, error } = useSelectedSeason()
  const playerId = Number(useParams().playerId)
  const statistics = usePlayerStatistics(playerId, season?.id)

  return (
    <PlayerScreen playerId={playerId} allTime={false} period={season?.name}>
      {isPending ? <Loading /> : error ? <ErrorBox error={error} /> : !season ? <Empty>{t.players.noSeason}</Empty> : <StatisticsOf query={statistics} />}
    </PlayerScreen>
  )
}

/** A player's page, with the statistics of every season. */
export function AllTimePlayerPage() {
  const playerId = Number(useParams().playerId)
  const statistics = usePlayerStatistics(playerId, null)

  return (
    <PlayerScreen playerId={playerId} allTime period={t.players.allSeasons}>
      <StatisticsOf query={statistics} />
    </PlayerScreen>
  )
}

function StatisticsOf({ query }: { query: ReturnType<typeof usePlayerStatistics> }) {
  const nickname = usePlayer(Number(useParams().playerId)).data?.nickname ?? ''
  if (query.isPending) return <Loading />
  if (query.error) return <ErrorBox error={query.error} />
  return <PlayerStatisticsView statistics={query.data!} nickname={nickname} />
}

function PlayerScreen({ playerId, allTime, period, children }: { playerId: number; allTime: boolean; period?: string; children: ReactNode }) {
  const player = usePlayer(playerId)
  const me = useMe()

  return (
    <>
      <Link to="/players" className={`${action} no-underline`}>{t.players.backToList}</Link>
      {player.isPending ? (
        <Loading />
      ) : player.error ? (
        <ErrorBox error={player.error} />
      ) : (
        <div className="flex flex-col gap-4">
          <PlayerProfile player={player.data!} canEdit={me.data?.abilities.manage_players === true} isSelf={me.data?.player?.id === playerId} />
          <section aria-labelledby="player-statistics">
            <div className="mb-3">
              <h2 id="player-statistics" className="font-display text-xl font-bold">{t.players.statistics}</h2>
              {period && <p className="text-muted wrap-anywhere">{period}</p>}
            </div>
            <PeriodSwitch seasonTo={`/players/${playerId}`} allTimeTo={`/players/${playerId}/all`} allTime={allTime} />
            {children}
          </section>
        </div>
      )}
    </>
  )
}

/** The photo, the names, the contact details the viewer may see, and the memo. */
export function PlayerProfile({ player, canEdit, isSelf }: { player: PlayerDetail; canEdit: boolean; isSelf: boolean }) {
  const photo = playerImageUrl(player, 'photo') ?? playerImageUrl(player, 'thumbnail')
  const name = fullNameIfDifferent(player.nickname, player.name)

  return (
    <>
      <PageHeader
        title={player.nickname}
        subtitle={name}
        action={
          (canEdit || isSelf) && (
            <span className="flex flex-wrap gap-x-4">
              {isSelf && <Link to="/profile" className={action}>{t.players.myProfile}</Link>}
              {canEdit && <Link to={`/admin/players/${player.id}`} className={action}>{t.common.edit}</Link>}
            </span>
          )
        }
      />
      <Card>
        {/*
          At phone width the memo goes below the photo, to use the whole width. From `sm` up it is beside it.
          With a large text size on a small phone the photo would leave no room for the details, so it is
          never wider than 30% of the screen, and the details break inside a word when they must.
        */}
        <div className="grid grid-cols-[auto_1fr] items-start gap-x-4 gap-y-3 sm:grid-rows-[auto_1fr] sm:gap-y-2">
          <div className="sm:row-span-2">
            {photo ? (
              <img src={photo} alt={t.players.photoAlt({ nickname: player.nickname })} className="w-24 max-w-[30vw] rounded-md bg-surface-sunken" />
            ) : (
              <PlayerThumbnail player={player} size="lg" />
            )}
          </div>
          {(player.archived || player.status === 'inactive' || player.email || player.birth_date) && (
            <div className="flex min-w-0 flex-col gap-2">
              {(player.archived || player.status === 'inactive') && (
                <p>{player.archived ? <Badge tone="danger">{t.common.archived}</Badge> : <Badge>{t.common.inactive}</Badge>}</p>
              )}
              {(player.email || player.birth_date) && (
                <dl className="grid grid-cols-1 gap-x-4 gap-y-1 text-sm wrap-anywhere sm:grid-cols-[auto_1fr]">
                  {player.email && (
                    <>
                      <dt className="text-muted">{t.players.email}</dt>
                      <dd className="wrap-anywhere"><a href={`mailto:${player.email}`} className={link}>{player.email}</a></dd>
                    </>
                  )}
                  {player.birth_date && (
                    <>
                      <dt className="text-muted">{t.players.birthDate}</dt>
                      <dd>{formatDate(player.birth_date)}</dd>
                    </>
                  )}
                </dl>
              )}
            </div>
          )}
          {/* Plain text, as typed: line breaks are kept and nothing in it becomes a link. */}
          {player.memo && <p className="col-span-2 min-w-0 whitespace-pre-line wrap-anywhere sm:col-span-1 sm:col-start-2">{player.memo}</p>}
        </div>
      </Card>
    </>
  )
}

const th = 'py-2 text-right'
const td = 'py-2 text-right tabular'

/** One view of a player's statistics: the numbers, each season, the charts and the nights scored. */
export function PlayerStatisticsView({ statistics, nickname }: { statistics: PlayerStatistics; nickname: string }) {
  const allTime = statistics.season_id === null

  return (
    <div className="flex flex-col gap-4">
      <StatTiles
        tiles={[
          { label: allTime ? t.players.overallPosition : t.common.position, value: statistics.rank === null ? '—' : ordinal(statistics.rank) },
          { label: t.common.points, value: formatPoints(statistics.points) },
          { label: t.players.nightsScored, value: statistics.nights_scored },
          { label: t.players.wins, value: statistics.wins },
        ]}
      />

      {statistics.nights_scored === 0 ? (
        <Empty>{allTime ? t.players.notScoredYet : t.players.notScoredThisSeason}</Empty>
      ) : (
        <>
          {allTime && (
            <Card title={t.players.bySeason}>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <caption className="sr-only">{t.players.bySeasonCaption({ nickname })}</caption>
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase text-muted">
                      <th scope="col" className="px-2 py-2">{t.common.season}</th>
                      <th scope="col" className={th}>{t.common.position}</th>
                      <th scope="col" className={`${th} hidden sm:table-cell`}>{t.players.scored}</th>
                      <th scope="col" className={`${th} hidden sm:table-cell`}>{t.players.wins}</th>
                      <th scope="col" className={`${th} pr-2`}>{t.common.points}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statistics.seasons.map((row) => (
                      <tr key={row.season_id} className="border-b border-border/60 last:border-0 even:bg-surface-stripe">
                        <th scope="row" className="px-2 py-2 text-left font-normal">
                          <Link to={`/seasons/${row.season_id}`} className={`${link} wrap-anywhere`}>{row.season_name}</Link>
                          <span className="block text-xs text-muted sm:hidden">
                            {t.players.nightsAndWins({ nights: row.nights_scored, wins: row.wins })}
                          </span>
                        </th>
                        <td className={td}>{ordinal(row.rank)}</td>
                        <td className={`${td} hidden sm:table-cell`}>{row.nights_scored}</td>
                        <td className={`${td} hidden sm:table-cell`}>{row.wins}</td>
                        <td className={`${td} pr-2 font-bold`}>{formatPoints(row.points)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          <Suspense fallback={<Loading label={t.players.loadingCharts} />}>
            <PlayerCharts statistics={statistics} nickname={nickname} />
          </Suspense>

          <Card title={t.players.results}>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <caption className="sr-only">{t.players.resultsCaption({ nickname })}</caption>
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-muted">
                    <th scope="col" className="px-2 py-2">{t.common.night}</th>
                    <th scope="col" className={th}>{t.common.position}</th>
                    <th scope="col" className={`${th} pr-2`}>{t.common.points}</th>
                  </tr>
                </thead>
                <tbody>
                  {statistics.results.map((row) => (
                    <tr key={row.night_id} className="border-b border-border/60 last:border-0 even:bg-surface-stripe">
                      <th scope="row" className="px-2 py-2 text-left font-normal">
                        <Link to={`/nights/${row.night_id}`} className={link}>{nightTitle(row.starts_at)}</Link>
                        {allTime && <span className="block text-xs text-muted wrap-anywhere">{row.season_name}</span>}
                      </th>
                      <td className={td}>{ordinal(row.position)}</td>
                      <td className={`${td} pr-2 font-bold`}>{formatPoints(row.points)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
