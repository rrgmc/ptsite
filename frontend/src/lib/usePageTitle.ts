import { useEffect } from 'react'
import { site } from './site'

const SITE = site.name

/**
 * Names the screen in the browser title: "Resultados · Liga Demo". A screen with no name yet, such as one that is
 * loading, shows the site's name alone.
 */
export function usePageTitle(name?: string) {
  useEffect(() => {
    document.title = name ? `${name} · ${SITE}` : SITE
    return () => { document.title = SITE }
  }, [name])
}
