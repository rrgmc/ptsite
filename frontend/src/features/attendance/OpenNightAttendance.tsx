import { ApiError, type Night, type Player } from '@/api/client'
import { useAnswerAttendance, useAttendance, useMe, useSeasonNights } from '@/api/queries'
import { useSelectedSeason } from '../layout/useSelectedSeason'
import { AttendanceBanner } from './AttendanceBanner'

/**
 * The attendance banner for the current season's open night, connected to the API. It shows nothing when no night
 * is open or the account has no player. The night is the current season's also while another season is on screen.
 */
export function OpenNightAttendance() {
  const { defaultSeason } = useSelectedSeason()
  const nights = useSeasonNights(defaultSeason?.id)
  const me = useMe()
  const night = nights.data?.find((n) => n.status === 'open' && !n.archived)
  const player = me.data?.player

  if (!night || !player) return null
  return <OpenNightAnswer night={night} player={player} />
}

function OpenNightAnswer({ night, player }: { night: Night; player: Player }) {
  const attendance = useAttendance(night.id)
  const answer = useAnswerAttendance(night.id)

  // Until the answers arrive, nothing: the buttons must not show to a player who already answered.
  if (!attendance.data) return null

  return (
    <AttendanceBanner
      night={night}
      answer={attendance.data.find((a) => a.player.id === player.id)?.answer ?? null}
      onAnswer={(value) => answer.mutate({ player, answer: value })}
      error={answer.error instanceof ApiError ? answer.error.body.message : undefined}
    />
  )
}
