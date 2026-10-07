import type { Player } from '@/api/client'
import { apiRoot } from './paths'

/** The address of a player's image. The version makes it a new address when the image changes: the API lets browsers keep it for a year. */
export function playerImageUrl(player: Pick<Player, 'id' | 'thumbnail_version' | 'photo_version'>, kind: 'thumbnail' | 'photo'): string | null {
  const version = kind === 'thumbnail' ? player.thumbnail_version : player.photo_version
  return version ? `${apiRoot}/v1/players/${player.id}/${kind}?v=${version}` : null
}
