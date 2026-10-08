import { Link } from 'react-router'
import type { Player } from '@/api/client'
import { useSeasonPath } from '@/lib/seasonPath'

/** A player's nickname, linked to the player's page for the season on screen. */
export function PlayerLink({ player, className = 'font-semibold' }: { player: Pick<Player, 'id' | 'nickname'>; className?: string }) {
  const to = useSeasonPath()
  return (
    <Link
      to={to(`/players/${player.id}`)}
      className={`rounded-sm wrap-anywhere hover:underline focus-visible:outline-3 focus-visible:outline-focus focus-visible:outline-offset-2 ${className}`}
    >
      {player.nickname}
    </Link>
  )
}
