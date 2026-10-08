import { useSyncExternalStore } from 'react'

/**
 * The last season this browser tab showed (docs/specs/seasons-and-nights.md). A season screen takes its season
 * from the address and never from here: this only tells the screens with no season of their own (Jogadores, a
 * night) which season their menu leads back to. It lasts until the browser tab closes or the user logs out.
 * None (null) means the current season, so a newly opened season is followed.
 */

const KEY = 'selectedSeasonId'

// Used when the browser refuses sessionStorage (private mode, blocked site data).
let fallback: number | null = null
let storageWorks = true
const listeners = new Set<() => void>()

export function getSelectedSeasonId(): number | null {
  if (storageWorks) {
    try {
      const id = Number(sessionStorage.getItem(KEY))
      return id > 0 ? id : null
    } catch {
      storageWorks = false
    }
  }
  return fallback
}

export function setSelectedSeasonId(id: number | null): void {
  fallback = id
  if (storageWorks) {
    try {
      if (id === null) sessionStorage.removeItem(KEY)
      else sessionStorage.setItem(KEY, String(id))
    } catch {
      storageWorks = false
    }
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useSelectedSeasonId(): number | null {
  return useSyncExternalStore(subscribe, getSelectedSeasonId)
}
