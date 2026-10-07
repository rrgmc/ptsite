import { useState } from 'react'
import { Label, Radio, RadioGroup } from 'react-aria-components'
import type { Attendance, Player } from '@/api/client'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { t } from '@/i18n'
import { PlayerPicker } from '@/components/PlayerPicker'
import { PlayerLink } from '@/components/PlayerLink'

export type Answer = 'all_in' | 'fold'

const choices: { id: Answer | 'none'; label: string }[] = [
  { id: 'all_in', label: t.attendance.allIn },
  { id: 'fold', label: t.attendance.fold },
  { id: 'none', label: t.attendance.notConfirmed },
]

/**
 * "Confirme sua presença": the player's own answer, the lists of who is coming and who folded, and for results
 * keepers and admins a way to answer for someone else (docs/specs/attendance.md).
 */
export function AttendancePanel({
  attendances,
  myPlayerId,
  myPlayer = null,
  isOpen,
  notOpenYet = false,
  canAnswerForOthers,
  players,
  onAnswer,
  error,
}: {
  attendances: Attendance[]
  /** The logged-in user's player; null for an account without a player. */
  myPlayerId: number | null
  /** The logged-in user's player record, to answer before it appears in any list. */
  myPlayer?: Player | null
  /** Whether the night takes answers: only while it is open. */
  isOpen: boolean
  /** The night is scheduled: answers start when it is opened. */
  notOpenYet?: boolean
  canAnswerForOthers: boolean
  /** For answering on someone's behalf. */
  players: Player[]
  onAnswer: (player: Player, answer: Answer | null) => void
  error?: string
}) {
  const coming = attendances.filter((a) => a.answer === 'all_in')
  const folded = attendances.filter((a) => a.answer === 'fold')
  const mine = attendances.find((a) => a.player.id === myPlayerId)?.answer ?? 'none'
  const [other, setOther] = useState<Player | null>(null)

  return (
    <Card title={isOpen && myPlayerId !== null ? t.attendance.panel.titleOpen : t.attendance.panel.title}>
      {isOpen && myPlayerId !== null && (
        <RadioGroup
          value={mine}
          onChange={(v) => {
            const me = players.find((p) => p.id === myPlayerId) ?? attendances.find((a) => a.player.id === myPlayerId)?.player ?? myPlayer
            if (me) onAnswer(me, v === 'none' ? null : (v as Answer))
          }}
          orientation="horizontal"
          className="mb-4 flex flex-col gap-2"
        >
          <Label className="text-sm font-semibold">{t.attendance.panel.yourAnswer}</Label>
          <div className="grid grid-cols-3 gap-2">
            {choices.map((c) => (
              <Radio
                key={c.id}
                value={c.id}
                className="flex min-h-touch cursor-pointer items-center justify-center rounded-md border border-border bg-surface px-2 text-center font-bold outline-none selected:border-primary selected:bg-primary selected:text-on-primary focus-visible:outline-3 focus-visible:outline-focus disabled:opacity-60"
              >
                {c.label}
              </Radio>
            ))}
          </div>
        </RadioGroup>
      )}

      {notOpenYet && <p className="mb-3 text-muted">{t.attendance.panel.notOpenYet}</p>}

      {error && <p role="alert" className="mb-3 rounded-md bg-danger-soft p-3 text-danger">{error}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <section aria-labelledby="attendance-coming">
          <h3 id="attendance-coming" className="mb-1 font-bold">{t.attendance.panel.comingHeading({ count: coming.length })}</h3>
          {coming.length === 0 ? (
            <p className="text-muted">{t.attendance.panel.nobodyConfirmed}</p>
          ) : (
            <ol className="list-inside list-decimal">
              {coming.map((a) => (
                <li key={a.player.id} className="py-0.5">
                  <PlayerLink player={a.player} className="underline" />
                  {a.answered_by && <span className="text-sm text-muted">{t.attendance.panel.answeredBy({ name: a.answered_by.name })}</span>}
                </li>
              ))}
            </ol>
          )}
        </section>
        <section aria-labelledby="attendance-fold">
          <h3 id="attendance-fold" className="mb-1 font-bold">{t.attendance.panel.foldedHeading({ count: folded.length })}</h3>
          {folded.length === 0 ? (
            <p className="text-muted">{t.attendance.panel.nobody}</p>
          ) : (
            <ul>
              {folded.map((a) => (
                <li key={a.player.id} className="py-0.5">
                  <PlayerLink player={a.player} className="underline" />
                  {a.answered_by && <span className="text-sm text-muted">{t.attendance.panel.answeredBy({ name: a.answered_by.name })}</span>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {isOpen && canAnswerForOthers && (
        <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
          <PlayerPicker label={t.attendance.panel.answerForOther} players={players} value={other} onChange={setOther} />
          <div className="grid grid-cols-3 gap-2">
            {choices.map((c) => (
              <Button
                key={c.id}
                variant="secondary"
                isDisabled={other === null}
                onPress={() => other && onAnswer(other, c.id === 'none' ? null : c.id)}
              >
                {c.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
