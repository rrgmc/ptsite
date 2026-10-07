import { NavLink, Route, Routes, useSearchParams } from 'react-router'
import { useMe } from '@/api/queries'
import { PageHeader } from '@/components/Card'
import { ErrorBox } from '@/components/Feedback'
import { AuditLogPage } from './AuditLogPage'
import { HolidaysAdmin } from './HolidaysAdmin'
import { PlaceEditPage, PlacesAdmin } from './PlacesAdmin'
import { PlayerEditPage, PlayersAdmin } from './PlayersAdmin'
import { SeasonPlanner } from './SeasonPlanner'
import { SeasonEditPage, SeasonsAdmin } from './SeasonsAdmin'

/** "Administração": loaded as a separate bundle, only for admins. The API checks permissions again. */
export function AdminRoutes() {
  const me = useMe()
  if (me.data?.role !== 'admin') {
    return <ErrorBox error={new Error('Somente administradores.')} />
  }

  const tab = ({ isActive }: { isActive: boolean }) =>
    `inline-flex min-h-touch items-center whitespace-nowrap rounded-md px-3 font-semibold ${isActive ? 'bg-primary text-on-primary' : 'text-muted hover:bg-surface-sunken'}`

  return (
    <>
      <PageHeader title="Administração" />
      <nav aria-label="Administração" className="-mx-4 mb-4 flex gap-1 overflow-x-auto px-4">
        <NavLink to="/admin" end className={tab}>Temporadas</NavLink>
        <NavLink to="/admin/players" className={tab}>Jogadores</NavLink>
        <NavLink to="/admin/places" className={tab}>Locais</NavLink>
        <NavLink to="/admin/holidays" className={tab}>Feriados</NavLink>
        <NavLink to="/admin/audit-log" className={tab}>Alterações</NavLink>
      </nav>
      <Routes>
        <Route index element={<SeasonsAdmin />} />
        <Route path="seasons/:seasonId" element={<SeasonEditPage />} />
        <Route path="seasons/:seasonId/plan"element={<SeasonPlanner />} />
        <Route path="holidays" element={<HolidaysPage />} />
        <Route path="players" element={<PlayersAdmin />} />
        <Route path="players/:playerId" element={<PlayerEditPage />} />
        <Route path="places" element={<PlacesAdmin />} />
        <Route path="places/:placeId" element={<PlaceEditPage />} />
        <Route path="audit-log" element={<AuditLogPage />} />
      </Routes>
    </>
  )
}

/** The holidays of the year in ?year=, or of next year: seasons are usually planned for the year ahead. */
function HolidaysPage() {
  const year = Number(useSearchParams()[0].get('year'))
  return <HolidaysAdmin initialYear={year >= 1900 && year <= 2200 ? year : undefined} />
}
