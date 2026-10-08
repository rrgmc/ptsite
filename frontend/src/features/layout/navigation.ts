import { t } from '@/i18n'
import { hasFeature } from '@/lib/features'
import type { FeatureName } from '@/site/features'

/**
 * Every place the menu leads to. The left menu lists all of them; `tab` also puts an item on the phone's bottom
 * bar (five at most) and `top` on the desktop top bar. A new item needs one line here.
 */
export interface NavItem {
  to: string
  label: string
  icon: string
  /** Active only on this exact path. */
  end?: boolean
  tab?: boolean
  top?: boolean
  adminOnly?: boolean
  /** Listed only on a site that has this feature. */
  feature?: FeatureName
}

export const navItems: NavItem[] = [
  { to: '/', label: t.layout.nav.standings, icon: '🏆', end: true, tab: true, top: true },
  { to: '/results', label: t.layout.nav.results, icon: '🃏', tab: true, top: true },
  { to: '/calendar', label: t.layout.nav.calendar, icon: '📅', tab: true, top: true },
  { to: '/simulator', label: t.layout.nav.simulator, icon: '🔮', tab: true, top: true },
  { to: '/players', label: t.layout.nav.players, icon: '👥', tab: true, top: true },
  { to: '/statistics', label: t.layout.nav.statistics, icon: '📊', top: true },
  { to: '/main-event', label: t.layout.nav.mainEvent, icon: '🏅', feature: 'mainEvent' },
  { to: '/seasons', label: t.layout.nav.seasons, icon: '🗂️', end: true, top: true },
  { to: '/profile', label: t.layout.nav.profile, icon: '👤' },
  { to: '/admin', label: t.layout.nav.admin, icon: '⚙️', top: true, adminOnly: true },
]

export function navItemsFor(role: string | undefined): NavItem[] {
  return navItems.filter((item) => (!item.adminOnly || role === 'admin') && (!item.feature || hasFeature(item.feature)))
}
