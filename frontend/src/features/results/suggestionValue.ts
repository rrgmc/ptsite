import type { SuggestedNight } from '@/api/client'

/** The suggestion's date and time as the form fields expect them. The API sends the league's local time. */
export function suggestionValue(s: Pick<SuggestedNight, 'starts_at'>): { date: string; time: string } {
  return { date: s.starts_at.slice(0, 10), time: s.starts_at.slice(11, 16) }
}
