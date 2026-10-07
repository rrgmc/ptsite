import type { Holiday } from '@/api/client'
import { t } from '@/i18n'

/** How a table holiday falls each year: "21/04" or "2 dias antes da Páscoa". */
export function holidayRule(h: Holiday): string {
  const r = t.admin.holidays.rule
  let rule: string
  if (h.easter_offset === null) {
    rule = r.fixed({ day: String(h.day).padStart(2, '0'), month: String(h.month).padStart(2, '0') })
  } else if (h.easter_offset === 0) {
    rule = r.easterSunday
  } else {
    const days = Math.abs(h.easter_offset)
    rule = h.easter_offset < 0 ? r.daysBefore({ days }) : r.daysAfter({ days })
  }
  if (h.first_year && h.last_year) return r.between({ rule, first: h.first_year, last: h.last_year })
  if (h.first_year) return r.since({ rule, first: h.first_year })
  if (h.last_year) return r.until({ rule, last: h.last_year })
  return rule
}
