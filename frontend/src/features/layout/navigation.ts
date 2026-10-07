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
  /** The screen shows the selected season. */
  seasonScreen?: boolean
}

export const navItems: NavItem[] = [
  { to: '/', label: 'Classificação', icon: '🏆', end: true, tab: true, top: true, seasonScreen: true },
  { to: '/results', label: 'Resultados', icon: '🃏', tab: true, top: true, seasonScreen: true },
  { to: '/calendar', label: 'Calendário', icon: '📅', tab: true, top: true, seasonScreen: true },
  { to: '/simulator', label: 'Simulação', icon: '🔮', tab: true, top: true, seasonScreen: true },
  { to: '/players', label: 'Jogadores', icon: '👥', tab: true, top: true },
  { to: '/statistics', label: 'Estatísticas', icon: '📊', top: true, seasonScreen: true },
  { to: '/seasons', label: 'Temporadas', icon: '🗂️', top: true },
  { to: '/profile', label: 'Meu perfil', icon: '👤' },
  { to: '/admin', label: 'Administração', icon: '⚙️', top: true, adminOnly: true },
]

export function navItemsFor(role: string | undefined): NavItem[] {
  return navItems.filter((item) => !item.adminOnly || role === 'admin')
}

/** A player's page shows the selected season too: /players/12, but not /players/12/all. */
const playerPage = /^\/players\/\d+$/

export function isSeasonScreen(path: string | undefined): path is string {
  return path !== undefined && (playerPage.test(path) || navItems.some((item) => item.seasonScreen && item.to === path))
}
