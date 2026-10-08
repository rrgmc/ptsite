import createClient, { type Middleware } from 'openapi-fetch'
import { apiRoot, csrfCookieUrl } from '@/lib/paths'
import type { components, paths } from './schema'

// Generated types: run `npm run api:types` after the backend's OpenAPI spec changes.
export type Schemas = components['schemas']
export type Player = Schemas['PlayerResource']
export type PlayerDetail = Schemas['PlayerDetailResource']
export type PlayerStatistics = Schemas['PlayerStatisticsResource']
export type Place = Schemas['PlaceResource']
export type Season = Schemas['SeasonResource']
export type Night = Schemas['NightResource']
export type User = Schemas['UserResource']
export type Standing = Schemas['StandingResource']
export type SeasonTopStandings = Schemas['SeasonTopStandingsResource']
export type SimulatedStanding = Schemas['SimulatedStandingResource']
export type AuditEntry = Schemas['AuditLogResource']
export type SuggestedNight = Schemas['SuggestedNightResource']
export type Attendance = Schemas['AttendanceResource']
export type PartialResult = Schemas['NightPartialResultResource']
export type NightDashboard = Schemas['NightDashboardResource']
export type Holiday = Schemas['HolidayResource']
export type CalendarHoliday = Schemas['CalendarHolidayResource']
export type PlannedDate = Schemas['PlannedDateResource']
export type CalendarEntry = Schemas['CalendarEntryResource']
export type Statistics = Schemas['StatisticsResource']
export type RankedList = Schemas['RankedListResource']

/** Error body from the API: Laravel's validation format, plus the rule code for business rules. */
export interface ApiErrorBody {
  message: string
  rule?: string
  errors?: Record<string, string[]>
}

export class ApiError extends Error {
  readonly status: number
  readonly body: ApiErrorBody

  constructor(status: number, body: ApiErrorBody) {
    super(body.message)
    this.status = status
    this.body = body
  }

  fieldError(field: string): string | undefined {
    return this.body.errors?.[field]?.[0]
  }
}

function readCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : undefined
}

/** Sanctum protects session requests with a CSRF token that it sets as the XSRF-TOKEN cookie. */
const csrf: Middleware = {
  onRequest({ request }) {
    request.headers.set('Accept', 'application/json')
    if (request.method !== 'GET') {
      const token = readCookie('XSRF-TOKEN')
      if (token) request.headers.set('X-XSRF-TOKEN', token)
    }
    return request
  },
}

export const api = createClient<paths>({ baseUrl: apiRoot, credentials: 'include' })
api.use(csrf)

export async function fetchCsrfCookie(): Promise<void> {
  await fetch(csrfCookieUrl, { credentials: 'include' })
}

/** Unwraps an openapi-fetch result: returns data, or throws an ApiError. */
export async function unwrap<T>(promise: Promise<{ data?: T; error?: unknown; response: Response }>): Promise<T> {
  const { data, error, response } = await promise
  if (!response.ok) {
    throw new ApiError(response.status, (error as ApiErrorBody) ?? { message: response.statusText })
  }
  return data as T
}
