import type { ReactElement } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router'

/**
 * Renders a screen at a URL, for stories of pages that read route parameters. With `layout`, the screen sits
 * inside it, as the pages sit inside the site's header and menus.
 */
export function RouterStory({ path, url, element, layout }: { path: string; url: string; element: ReactElement; layout?: ReactElement }) {
  const other = { path: '*', element: <p>Navegou para outra página.</p> }
  const router = createMemoryRouter(layout ? [{ element: layout, children: [{ path, element }, other] }] : [{ path, element }, other], {
    initialEntries: [url],
  })
  return <RouterProvider router={router} />
}
