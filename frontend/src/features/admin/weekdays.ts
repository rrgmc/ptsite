import { t } from '@/i18n'

const names = t.admin.weekdays

/** ISO weekdays (1 = Monday … 7 = Sunday), as the API sends them. */
export const WEEKDAYS = [names.monday, names.tuesday, names.wednesday, names.thursday, names.friday, names.saturday, names.sunday].map((label, i) => ({ id: i + 1, label }))

export const EVERY_WEEKS = [
  { id: 1, label: t.admin.everyWeeks.one },
  { id: 2, label: t.admin.everyWeeks.two },
  { id: 3, label: t.admin.everyWeeks.three },
  { id: 4, label: t.admin.everyWeeks.four },
]
