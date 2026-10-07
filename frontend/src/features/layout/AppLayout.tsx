import { useState } from 'react'
import { Link, NavLink, Navigate, Outlet, ScrollRestoration, useLocation } from 'react-router'
import { useLogout, useMe } from '@/api/queries'
import { Loading } from '@/components/Feedback'
import { t } from '@/i18n'
import { setSelectedSeasonId } from '@/lib/selectedSeason'
import { NavDrawer } from './NavDrawer'
import { isSeasonScreen, navItemsFor } from './navigation'
import { SeasonNotice } from './SeasonNotice'
import { SiteFooter } from './SiteFooter'
import { useSelectedSeason } from './useSelectedSeason'
import { site } from '@/lib/site'

export function AppLayout() {
  const me = useMe()
  const logout = useLogout()
  const location = useLocation()
  // After "Sair" the next person logs in fresh; only an expired session returns to the page it was on.
  const [loggingOut, setLoggingOut] = useState(false)

  if (me.isPending) return <Loading />
  if (!me.data) return <Navigate to="/login" replace state={loggingOut ? undefined : { from: location.pathname }} />

  const user = me.data
  const items = navItemsFor(user.role)
  const userName = user.player?.nickname ?? user.name
  const logOut = () => { setLoggingOut(true); logout.mutate() }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex min-h-touch min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 text-xs font-semibold sm:flex-none sm:flex-row sm:gap-2 sm:rounded-md sm:px-2 sm:text-sm ${
      isActive ? 'text-primary sm:bg-primary-soft' : 'text-muted hover:text-text'
    }`

  return (
    <div className="flex min-h-dvh flex-col pb-20 sm:pb-0">
      <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-2 gap-y-0 px-4 py-2">
          <NavDrawer items={items} userName={userName} onLogout={logOut} />
          <NavLink to="/" className="flex shrink-0 items-center gap-2 font-display text-xl font-extrabold text-primary">
            <span aria-hidden>{site.logo}</span> {site.shortName}
          </NavLink>
          <nav aria-label={t.layout.mainNav} className="hidden flex-wrap gap-1 sm:flex">
            {items.filter((item) => item.top).map((item) => (
              // Words only: with the menu button and the season name, the icons do not fit the top bar.
              <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          {/* On a phone the season name is cut short before it takes a second line: a wrapping row only moves an
              item down when its basis does not fit, so the basis is the least room the name needs. */}
          <div className="ml-auto flex min-w-0 max-w-full flex-1 basis-24 items-center justify-end gap-2 text-sm sm:flex-none sm:basis-auto">
            <SelectedSeasonLink />
            {/* On a phone "Sair" is in the menu, so the season name has room. */}
            <button type="button" onClick={logOut} className="hidden min-h-touch rounded-md px-2 font-semibold text-primary hover:bg-primary-soft sm:block">
              {t.common.logOut}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-4">
        <SelectedSeasonNotice />
        <Outlet />
      </main>
      <SiteFooter />
      {/* A new page opens at the top; going back returns to where the previous page was scrolled. */}
      <ScrollRestoration />

      <nav aria-label={t.layout.mainNav} className="fixed inset-x-0 bottom-0 z-20 flex border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] sm:hidden">
        {items.filter((item) => item.tab).map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
            <span aria-hidden className="text-lg">{item.icon}</span>
            <span className="max-w-full truncate font-medium tracking-tight">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

/** The season on screen, as the way to "Temporadas". Picking a season there returns to the screen it was opened from. */
function SelectedSeasonLink() {
  const { season } = useSelectedSeason()
  const { pathname } = useLocation()
  if (!season) return null
  return (
    <Link
      to="/seasons"
      state={isSeasonScreen(pathname) ? { from: pathname } : undefined}
      className="flex min-h-touch min-w-0 items-center gap-1 rounded-md px-1 font-semibold text-primary hover:bg-primary-soft sm:px-2"
    >
      <span className="sr-only">{t.layout.seasonPrefix} </span>
      <span className="truncate">{season.name}</span>
      <span aria-hidden>›</span>
    </Link>
  )
}

function SelectedSeasonNotice() {
  const { season, isCurrent } = useSelectedSeason()
  const { pathname } = useLocation()
  if (isCurrent || !season || !isSeasonScreen(pathname)) return null
  return <SeasonNotice season={season} onBack={() => setSelectedSeasonId(null)} />
}
