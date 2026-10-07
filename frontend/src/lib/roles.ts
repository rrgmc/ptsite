import { t } from '@/i18n'

export type Role = 'player' | 'results_keeper' | 'admin'

/** The roles as the screens name them (docs/specs/accounts-and-roles.md). */
export const roleLabels: Record<Role, string> = t.common.roles
