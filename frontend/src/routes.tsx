import { createBrowserRouter, type LoaderFunctionArgs, redirect } from 'react-router'
import { ForgotPasswordPage } from './features/auth/ForgotPasswordPage'
import { LoginPage } from './features/auth/LoginPage'
import { ResetPasswordPage } from './features/auth/ResetPasswordPage'
import { CalendarPage } from './features/calendar/CalendarPage'
import { AppLayout } from './features/layout/AppLayout'
import { ErrorPage } from './features/layout/ErrorPage'
import { MainEventPage } from './features/mainEvent/MainEventPage'
import { MainEventResultFormPage } from './features/mainEvent/MainEventResultFormPage'
import { NightPage } from './features/nights/NightPage'
import { NightEditPage } from './features/nights/NightEditPage'
import { PartialResultFormPage } from './features/nights/PartialResultFormPage'
import { ResultFormPage } from './features/nights/ResultFormPage'
import { AllTimePlayerPage, PlayerPage } from './features/players/PlayerPage'
import { PlayersPage } from './features/players/PlayersPage'
import { ProfilePage } from './features/profile/ProfilePage'
import { ResultsPage } from './features/results/ResultsPage'
import { SeasonPickerPage } from './features/seasons/SeasonPickerPage'
import { SeasonsPage } from './features/seasons/SeasonsPage'
import { SimulatorPage } from './features/simulator/SimulatorPage'
import { StandingsPage } from './features/standings/StandingsPage'
import { hasFeature } from './lib/features'
import { setSelectedSeasonId } from './lib/selectedSeason'

/** A link to one season (/seasons/7/results): picks that season, then opens the screen. */
const pickSeason = (screen: string) => ({ params }: LoaderFunctionArgs) => {
  const id = Number(params.seasonId)
  if (id > 0) setSelectedSeasonId(id)
  return redirect(screen)
}

/** The statistics screens load as a separate bundle, which holds the chart library. */
const statistics = (page: 'StatisticsPage' | 'AllTimeStatisticsPage') => () =>
  import('./features/statistics/StatisticsPage').then((m) => ({ Component: m[page] }))

/** The Main Event's screens, on a site that has it. */
const mainEvent = hasFeature('mainEvent')
  ? [
      { path: 'main-event', element: <MainEventPage /> },
      { path: 'seasons/:seasonId/main-event', loader: pickSeason('/main-event') },
      { path: 'nights/:nightId/main-event-result', element: <MainEventResultFormPage /> },
    ]
  : []

// URLs are in English, like the code; screens are in Brazilian Portuguese. The admin section and the statistics
// load as separate bundles; a player's page loads its charts the same way.
export const router = createBrowserRouter(
  [
    { path: '/login', element: <LoginPage />, errorElement: <ErrorPage /> },
    { path: '/forgot-password', element: <ForgotPasswordPage />, errorElement: <ErrorPage /> },
    { path: '/reset-password', element: <ResetPasswordPage />, errorElement: <ErrorPage /> },
    {
      element: <AppLayout />,
      errorElement: <ErrorPage />,
      children: [
        { index: true, element: <StandingsPage /> },
        { path: 'results', element: <ResultsPage /> },
        { path: 'calendar', element: <CalendarPage /> },
        { path: 'simulator', element: <SimulatorPage /> },
        { path: 'statistics', lazy: statistics('StatisticsPage') },
        { path: 'statistics/all', lazy: statistics('AllTimeStatisticsPage') },
        { path: 'seasons', element: <SeasonsPage /> },
        { path: 'seasons/select', element: <SeasonPickerPage /> },
        { path: 'seasons/:seasonId', loader: pickSeason('/') },
        { path: 'seasons/:seasonId/results', loader: pickSeason('/results') },
        { path: 'seasons/:seasonId/calendar', loader: pickSeason('/calendar') },
        { path: 'seasons/:seasonId/simulator', loader: pickSeason('/simulator') },
        { path: 'seasons/:seasonId/statistics', loader: pickSeason('/statistics') },
        { path: 'nights/:nightId', element: <NightPage /> },
        { path: 'nights/:nightId/edit', element: <NightEditPage /> },
        { path: 'nights/:nightId/result', element: <ResultFormPage /> },
        { path: 'nights/:nightId/partial-result', element: <PartialResultFormPage /> },
        ...mainEvent,
        { path: 'players', element: <PlayersPage /> },
        { path: 'players/:playerId', element: <PlayerPage /> },
        { path: 'players/:playerId/all', element: <AllTimePlayerPage /> },
        { path: 'profile', element: <ProfilePage /> },
        { path: 'admin/*', lazy: () => import('./features/admin/AdminRoutes').then((m) => ({ Component: m.AdminRoutes })) },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL.replace(/\/$/, '') },
)
