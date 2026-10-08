import { Navigate, Outlet, ScrollRestoration, useLocation } from 'react-router'
import { useMe } from '@/api/queries'
import { Loading } from '@/components/Feedback'
import { SiteFooter } from './SiteFooter'

/**
 * The frame of a screen that fills the phone, with no header and no menus: the night dashboard. Like AppLayout,
 * it sends a visitor who is not logged in to the login page, and back to this screen afterwards. The screen has
 * its own way back to the site.
 */
export function BareLayout() {
  const me = useMe()
  const location = useLocation()

  if (me.isPending) return <Loading />
  if (!me.data) return <Navigate to="/login" replace state={{ from: location.pathname }} />

  return (
    <div className="flex min-h-dvh flex-col">
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pt-3">
        <Outlet />
      </main>
      <SiteFooter />
      <ScrollRestoration />
    </div>
  )
}
