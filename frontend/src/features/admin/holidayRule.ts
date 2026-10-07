import type { Holiday } from '@/api/client'

/** How a table holiday falls each year: "21/04" or "2 dias antes da Páscoa". */
export function holidayRule(h: Holiday): string {
  let rule: string
  if (h.easter_offset === null) {
    rule = `Todo ano em ${String(h.day).padStart(2, '0')}/${String(h.month).padStart(2, '0')}`
  } else if (h.easter_offset === 0) {
    rule = 'No domingo de Páscoa'
  } else {
    const days = Math.abs(h.easter_offset)
    rule = `${days} ${days === 1 ? 'dia' : 'dias'} ${h.easter_offset < 0 ? 'antes' : 'depois'} da Páscoa`
  }
  if (h.first_year && h.last_year) return `${rule}, de ${h.first_year} a ${h.last_year}`
  if (h.first_year) return `${rule}, desde ${h.first_year}`
  if (h.last_year) return `${rule}, até ${h.last_year}`
  return rule
}
