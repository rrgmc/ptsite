import type { Night, User } from '@/api/client'

/**
 * "Editar evento": results keepers and admins edit a scheduled night; only admins an open or finished one. A
 * cancelled night is not edited. The API checks the same.
 */
export function canEditNight(night: Night, user: User | null | undefined): boolean {
  if (!user || night.archived) return false
  return night.status === 'scheduled' ? user.abilities.run_nights : user.abilities.edit_played_nights
}
