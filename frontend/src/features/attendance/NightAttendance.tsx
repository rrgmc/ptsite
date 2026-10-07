import { ApiError, type Night } from '@/api/client'
import { useAnswerAttendance, useAttendance, useMe, usePlayers } from '@/api/queries'
import { ErrorBox, Loading } from '@/components/Feedback'
import { AttendancePanel } from './AttendancePanel'

/** The attendance panel for a night, connected to the API. */
export function NightAttendance({ night }: { night: Night }) {
  const me = useMe()
  const attendance = useAttendance(night.id)
  const canAnswerForOthers = Boolean(me.data?.abilities.run_nights)
  const players = usePlayers()
  const answer = useAnswerAttendance(night.id)

  if (attendance.isPending) return <Loading />
  if (attendance.error) return <ErrorBox error={attendance.error} />

  return (
    <AttendancePanel
      attendances={attendance.data ?? []}
      myPlayerId={me.data?.player?.id ?? null}
      myPlayer={me.data?.player ?? null}
      isOpen={night.status === 'open' && !night.archived}
      notOpenYet={night.status === 'scheduled' && !night.archived}
      canAnswerForOthers={canAnswerForOthers}
      players={canAnswerForOthers ? (players.data ?? []) : []}
      onAnswer={(player, value) => answer.mutate({ player, answer: value })}
      error={answer.error instanceof ApiError ? answer.error.body.message : undefined}
    />
  )
}
