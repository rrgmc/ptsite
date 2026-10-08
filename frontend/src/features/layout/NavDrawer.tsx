import { Button as AriaButton, Dialog, DialogTrigger, Modal, ModalOverlay } from 'react-aria-components'
import { NavLink } from 'react-router'
import { Button } from '@/components/Button'
import { t } from '@/i18n'
import { useSeasonPath } from '@/lib/seasonPath'
import type { NavItem } from './navigation'
import { site } from '@/lib/site'

/** The left menu: every place of the site, then the user and "Sair". Opens from the "Menu" button in the header. */
export function NavDrawer({ items, userName, onLogout, defaultOpen }: { items: NavItem[]; userName: string; onLogout: () => void; defaultOpen?: boolean }) {
  const to = useSeasonPath()
  return (
    <DialogTrigger defaultOpen={defaultOpen}>
      <AriaButton
        aria-label={t.layout.menu}
        className="-ml-2 flex min-h-touch min-w-touch shrink-0 items-center justify-center rounded-md text-xl text-primary hover:bg-primary-soft focus-visible:outline-3 focus-visible:outline-focus"
      >
        <span aria-hidden>☰</span>
      </AriaButton>
      <ModalOverlay isDismissable className="fixed inset-0 z-50 bg-black/40">
        <Modal className="fixed inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col overflow-y-auto bg-surface shadow-raised">
          <Dialog aria-label={t.layout.menu} className="flex flex-1 flex-col gap-3 p-3 outline-none">
            {({ close }) => (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-2 px-2 font-display text-xl font-extrabold text-primary">
                    <span aria-hidden>{site.logo}</span> {site.name}
                  </span>
                  <Button variant="ghost" onPress={close}>{t.common.close}</Button>
                </div>
                <nav aria-label={t.layout.menu} className="flex flex-col gap-1">
                  {items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={to(item.to)}
                      end={item.end}
                      onClick={close}
                      className={({ isActive }) =>
                        `flex min-h-touch items-center gap-3 rounded-md px-3 py-2 font-semibold wrap-anywhere ${isActive ? 'bg-primary-soft text-primary' : 'text-text hover:bg-surface-sunken'}`
                      }
                    >
                      <span aria-hidden className="text-lg">{item.icon}</span>
                      {item.label}
                    </NavLink>
                  ))}
                </nav>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                  <span className="min-w-0 px-3 text-muted wrap-anywhere">{userName}</span>
                  <Button variant="ghost" onPress={() => { close(); onLogout() }}>{t.common.logOut}</Button>
                </div>
              </>
            )}
          </Dialog>
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  )
}
