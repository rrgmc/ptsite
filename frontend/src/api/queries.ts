import { keepPreviousData, useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { t } from '@/i18n'
import { setSelectedSeasonId } from '@/lib/selectedSeason'
import { ApiError, api, type Attendance, fetchCsrfCookie, type PartialResult, type Player, unwrap } from './client'

// One place for every server call the screens make, as TanStack Query hooks.

export const keys = {
  me: ['me'] as const,
  seasons: ['seasons'] as const,
  currentSeason: ['seasons', 'current'] as const,
  season: (id: number) => ['seasons', id] as const,
  standings: (id: number) => ['seasons', id, 'standings'] as const,
  /** Starts with "seasons", so a changed result refreshes it with the standings. */
  seasonsTopStandings: ['seasons', 'top-standings'] as const,
  /** `null` is every season. */
  statistics: (seasonId: number | null) => ['statistics', seasonId] as const,
  /** Starts with "statistics", so a changed result refreshes it with the league's. */
  playerStatistics: (playerId: number, seasonId: number | null) => ['statistics', 'player', playerId, seasonId] as const,
  nights: (id: number) => ['seasons', id, 'nights'] as const,
  suggestions: (id: number) => ['seasons', id, 'night-suggestions'] as const,
  night: (id: number) => ['nights', id] as const,
  attendance: (nightId: number) => ['nights', nightId, 'attendance'] as const,
  partialResult: (nightId: number) => ['nights', nightId, 'partial-result'] as const,
  players: (filters: object) => ['players', filters] as const,
  places: ['places'] as const,
  audit: (page: number) => ['audit', page] as const,
  holidays: ['holidays'] as const,
  holidayCalendar: (year: number) => ['holidays', 'calendar', year] as const,
  nightPlan: (id: number, from: string, to: string, count?: number) => ['seasons', id, 'night-plan', from, to, count] as const,
  calendar: (id: number) => ['seasons', id, 'calendar'] as const,
}

export function useMe() {
  return useQuery({
    queryKey: keys.me,
    queryFn: async () => {
      const { data, response } = await api.GET('/v1/me')
      if (response.status === 401) return null
      if (!response.ok) throw new Error(t.api.loadUserFailed)
      return data!.data
    },
    staleTime: 5 * 60_000,
  })
}

export function useLogin() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (body: { username: string; password: string; remember: boolean }) => {
      await fetchCsrfCookie()
      return (await unwrap(api.POST('/v1/login', { body }))).data
    },
    onSuccess: (user) => client.setQueryData(keys.me, user),
  })
}

/** Changes the logged-in user's own password. The session stays logged in. */
export function useChangePassword() {
  return useMutation({
    mutationFn: (body: { current_password: string; password: string }) => unwrap(api.PUT('/v1/me/password', { body })),
  })
}

/** Asks for a password link by email. The answer is the address it went to, with most of its name hidden. */
export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: async (body: { login: string }) => {
      await fetchCsrfCookie()
      return (await unwrap(api.POST('/v1/password-resets', { body }))).data
    },
  })
}

/** The account behind a password link. Fails when the link expired or was used; an empty token is not asked. */
export function usePasswordReset(token: string) {
  return useQuery({
    queryKey: ['password-resets', token],
    queryFn: async () => (await unwrap(api.GET('/v1/password-resets/{token}', { params: { path: { token } } }))).data,
    enabled: token !== '',
    retry: false,
    staleTime: Infinity,
  })
}

/** Sets a new password with a password link. Every login of the account ends, this browser's too. */
export function useCompletePasswordReset(token: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (body: { password: string }) => {
      await fetchCsrfCookie()
      return unwrap(api.POST('/v1/password-resets/{token}/complete', { params: { path: { token } }, body }))
    },
    onSuccess: () => client.resetQueries({ queryKey: keys.me }),
  })
}

export function useLogout() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: () => unwrap(api.POST('/v1/logout')),
    onSuccess: () => {
      client.clear()
      client.setQueryData(keys.me, null)
      // The next person starts on the current season.
      setSelectedSeasonId(null)
    },
  })
}

export function useSeasons() {
  return useQuery({ queryKey: keys.seasons, queryFn: async () => (await unwrap(api.GET('/v1/seasons'))).data })
}

export function useCurrentSeason() {
  return useQuery({
    queryKey: keys.currentSeason,
    queryFn: async () => {
      const { data, response } = await api.GET('/v1/seasons/current')
      if (response.status === 404) return null
      if (!response.ok) throw new Error(t.api.loadSeasonFailed)
      return data!.data
    },
  })
}

export function useSeason(id: number) {
  return useQuery({
    queryKey: keys.season(id),
    enabled: id > 0,
    // A season that does not exist stays missing; the selected season then falls back at once.
    retry: (failures, error) => !(error instanceof ApiError && error.status === 404) && failures < 1,
    queryFn: async () => (await unwrap(api.GET('/v1/seasons/{season}', { params: { path: { season: id } } }))).data,
  })
}

export function useStandings(seasonId: number | undefined) {
  return useQuery({
    queryKey: keys.standings(seasonId ?? 0),
    enabled: seasonId !== undefined,
    queryFn: async () =>
      (await unwrap(api.GET('/v1/seasons/{season}/standings', { params: { path: { season: seasonId! } } }))).data,
  })
}

/** Every season, newest first, each with the first ten of its standings. */
export function useSeasonsTopStandings() {
  return useQuery({
    queryKey: keys.seasonsTopStandings,
    queryFn: async () => (await unwrap(api.GET('/v1/seasons/top-standings'))).data,
  })
}

/** The statistics of one season, or of every season with `null`. Waits while the season is not known yet. */
export function useStatistics(seasonId: number | null | undefined) {
  return useQuery({
    queryKey: keys.statistics(seasonId ?? null),
    enabled: seasonId !== undefined,
    queryFn: async () =>
      (await unwrap(api.GET('/v1/statistics', { params: { query: seasonId ? { season: seasonId } : {} } }))).data,
  })
}

/** One player's statistics in one season, or in every season with `null`. Waits while the season is not known yet. */
export function usePlayerStatistics(playerId: number, seasonId: number | null | undefined) {
  return useQuery({
    queryKey: keys.playerStatistics(playerId, seasonId ?? null),
    enabled: seasonId !== undefined,
    queryFn: async () =>
      (await unwrap(api.GET('/v1/players/{player}/statistics', { params: { path: { player: playerId }, query: seasonId ? { season: seasonId } : {} } }))).data,
  })
}

export function useSeasonNights(seasonId: number | undefined) {
  return useQuery({
    queryKey: keys.nights(seasonId ?? 0),
    enabled: seasonId !== undefined,
    queryFn: async () =>
      (await unwrap(api.GET('/v1/seasons/{season}/nights', { params: { path: { season: seasonId! } } }))).data,
  })
}

export function useNightSuggestions(seasonId: number) {
  return useQuery({
    queryKey: keys.suggestions(seasonId),
    queryFn: async () =>
      (await unwrap(api.GET('/v1/seasons/{season}/night-suggestions', { params: { path: { season: seasonId } } }))).data,
  })
}

export function useAttendance(nightId: number | undefined) {
  return useQuery({
    queryKey: keys.attendance(nightId ?? 0),
    enabled: nightId !== undefined,
    queryFn: async () =>
      (await unwrap(api.GET('/v1/nights/{night}/attendance', { params: { path: { night: nightId! } } }))).data,
  })
}

/**
 * Sets a player's answer ("all_in" or "fold"), or removes it (null). The lists update at once and roll back if
 * the API refuses; they are then refreshed from the API. Answers for a night are sent one at a time, in order,
 * so quick taps (ALL IN, then FOLD) always end with the last one.
 */
export function useAnswerAttendance(nightId: number) {
  const client = useQueryClient()
  const key = keys.attendance(nightId)
  return useMutation({
    scope: { id: `attendance-${nightId}` },
    mutationFn: async ({ player, answer }: { player: Player; answer: 'all_in' | 'fold' | null }) => {
      const path = { params: { path: { night: nightId, player: player.id } } }
      if (answer === null) {
        await unwrap(api.DELETE('/v1/nights/{night}/attendance/{player}', path))
      } else {
        await unwrap(api.PUT('/v1/nights/{night}/attendance/{player}', { ...path, body: { answer } }))
      }
    },
    onMutate: async ({ player, answer }) => {
      await client.cancelQueries({ queryKey: key })
      const previous = client.getQueryData<Attendance[]>(key)
      if (previous) {
        const current = previous.find((a) => a.player.id === player.id)
        // Same rules as the API: repeating an answer changes nothing; a new answer goes to the end.
        if (current?.answer !== answer) {
          const others = previous.filter((a) => a.player.id !== player.id)
          client.setQueryData<Attendance[]>(key, answer === null ? others : [
            ...others,
            { player, answer, answered_at: new Date().toISOString(), answered_by: current?.answered_by ?? null },
          ])
        }
      }
      return { previous }
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) client.setQueryData(key, context.previous)
    },
    onSettled: () => {
      // Refresh only after the last queued answer, so an older reply does not briefly undo a newer tap.
      if (client.isMutating({ predicate: (m) => m.options.scope?.id === `attendance-${nightId}` }) <= 1) {
        client.invalidateQueries({ predicate: (q) => q.queryKey[2] === 'calendar' }) // the ALL IN counts
        return client.invalidateQueries({ queryKey: key })
      }
    },
  })
}

/** An open night's partial result ("Resultado parcial"). Every field is empty when nobody saved one. */
export function usePartialResult(nightId: number, enabled = true) {
  return useQuery({
    queryKey: keys.partialResult(nightId),
    enabled,
    queryFn: async () =>
      (await unwrap(api.GET('/v1/nights/{night}/partial-result', { params: { path: { night: nightId } } }))).data,
  })
}

/**
 * The partial result read once, to start a form from. A form copies it into its own state, so this is kept out
 * of the shared cache: it is read again each time a form opens, and never refreshed under the person typing.
 */
export function usePartialResultSeed(nightId: number, enabled = true) {
  return useQuery({
    queryKey: [...keys.partialResult(nightId), 'seed'],
    enabled,
    gcTime: 0,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    queryFn: async () =>
      (await unwrap(api.GET('/v1/nights/{night}/partial-result', { params: { path: { night: nightId } } }))).data,
  })
}

export interface PartialResultInput {
  pot: string | null
  main_event_pot: string | null
  time_chip: string | null
  positions: { position: number; player_id: number }[]
}

/** Saves the partial result, replacing all of it. Saves for a night are sent one at a time, in order. */
export function useSavePartialResult(nightId: number) {
  const client = useQueryClient()
  return useMutation({
    scope: { id: `partial-result-${nightId}` },
    mutationFn: async (body: PartialResultInput) =>
      (await unwrap(api.PUT('/v1/nights/{night}/partial-result', { params: { path: { night: nightId } }, body }))).data,
    onSuccess: (saved) => client.setQueryData<PartialResult>(keys.partialResult(nightId), saved),
  })
}

export function useNight(id: number) {
  return useQuery({
    queryKey: keys.night(id),
    queryFn: async () => (await unwrap(api.GET('/v1/nights/{night}', { params: { path: { night: id } } }))).data,
  })
}

export function usePlayers(filters: { search?: string; status?: 'active' | 'inactive'; archived?: boolean } = {}) {
  return useQuery({
    queryKey: keys.players(filters),
    placeholderData: keepPreviousData,
    queryFn: async () =>
      (
        await unwrap(
          api.GET('/v1/players', {
            params: { query: { ...filters, archived: filters.archived ? 1 : undefined } as never },
          }),
        )
      ).data,
  })
}

/** One player; admins also get its login. Shares the ['players'] key, so saving a player refreshes it. */
/** One player, with the memo. */
export function usePlayer(id: number | undefined) {
  return useQuery({
    queryKey: ['players', 'one', id],
    enabled: id !== undefined,
    queryFn: async () => (await unwrap(api.GET('/v1/players/{player}', { params: { path: { player: id! } } }))).data,
  })
}

/** Places, by name. `archived` adds the archived ones (admins); the place pickers leave it out. */
export function usePlaces({ archived = false }: { archived?: boolean } = {}) {
  return useQuery({
    // The filter is in the key, so the pickers never get the admin list's archived places from the cache.
    queryKey: [...keys.places, { archived }],
    queryFn: async () =>
      (await unwrap(api.GET('/v1/places', { params: { query: { archived: archived ? 1 : undefined } as never } }))).data,
  })
}

export interface ResultInput {
  pot: string
  /** Null on a site with no Main Event pot. */
  main_event_pot: string | null
  /** Null on a site with no time chip. */
  time_chip: string | null
  positions: { position: number; player_id: number }[]
}

/** Invalidate everything a change to a night can affect: the night, its season's nights and standings. */
function useNightChanged() {
  const client = useQueryClient()
  return (seasonId: number, nightId?: number) => {
    if (nightId) client.invalidateQueries({ queryKey: keys.night(nightId) })
    client.invalidateQueries({ queryKey: keys.nights(seasonId) })
    client.invalidateQueries({ queryKey: keys.suggestions(seasonId) })
    client.invalidateQueries({ queryKey: keys.standings(seasonId) })
    client.invalidateQueries({ queryKey: ['statistics'] })
    client.invalidateQueries({ queryKey: keys.calendar(seasonId) })
    client.invalidateQueries({ queryKey: keys.season(seasonId) })
    client.invalidateQueries({ queryKey: keys.currentSeason })
    // "Temporadas" shows the Main Event champion.
    client.invalidateQueries({ queryKey: keys.seasonsTopStandings })
  }
}

export function useOpenNight() {
  const changed = useNightChanged()
  return useMutation({
    mutationFn: async (nightId: number) =>
      (await unwrap(api.POST('/v1/nights/{night}/open', { params: { path: { night: nightId } } }))).data,
    onSuccess: (night) => changed(night.season_id, night.id),
  })
}

export function useFinishNight(nightId: number) {
  const changed = useNightChanged()
  return useMutation({
    mutationFn: async (body: ResultInput) =>
      (await unwrap(api.POST('/v1/nights/{night}/finish', { params: { path: { night: nightId } }, body }))).data,
    onSuccess: (night) => changed(night.season_id, night.id),
  })
}

export function useScheduleNight(seasonId: number) {
  const changed = useNightChanged()
  return useMutation({
    mutationFn: async (body: { starts_at: string; place_id?: number | null; description?: string | null; type?: 'regular' | 'main_event'; is_extra?: boolean }) =>
      (await unwrap(api.POST('/v1/seasons/{season}/nights', { params: { path: { season: seasonId } }, body }))).data,
    onSuccess: () => changed(seasonId),
  })
}

/** "Remarcar": a scheduled night's new date and time. */
export function useRescheduleNight(nightId: number) {
  const changed = useNightChanged()
  return useMutation({
    mutationFn: async (body: { starts_at: string }) =>
      (await unwrap(api.POST('/v1/nights/{night}/reschedule', { params: { path: { night: nightId } }, body }))).data,
    onSuccess: (night) => changed(night.season_id, night.id),
  })
}

/** "Finalizar" for a Main Event night: its players in finishing order, the 1st place first. */
export function useFinishMainEventNight(nightId: number) {
  const changed = useNightChanged()
  return useMutation({
    mutationFn: async (body: { player_ids: number[] }) =>
      (await unwrap(api.POST('/v1/nights/{night}/main-event-result', { params: { path: { night: nightId } }, body }))).data,
    onSuccess: (night) => changed(night.season_id, night.id),
  })
}

/** Records a Main Event that was already played, in one step. A finished season takes it too. */
export function useImportMainEventNight(seasonId: number) {
  const changed = useNightChanged()
  return useMutation({
    mutationFn: async (body: { starts_at: string; place_id?: number | null; description?: string | null; player_ids: number[] }) =>
      (await unwrap(api.POST('/v1/seasons/{season}/main-event/import', { params: { path: { season: seasonId } }, body }))).data,
    onSuccess: () => changed(seasonId),
  })
}

/** "Editar evento": a night's place and description, and whether it is extra. Only the fields sent are changed. */
export function useUpdateNight(nightId: number) {
  const changed = useNightChanged()
  return useMutation({
    mutationFn: async (body: { place_id?: number | null; description?: string | null; is_extra?: boolean }) =>
      (await unwrap(api.PATCH('/v1/nights/{night}', { params: { path: { night: nightId } }, body }))).data,
    onSuccess: (night) => changed(night.season_id, night.id),
  })
}

/** "Cancelar": archives a scheduled night. */
export function useCancelNight(nightId: number) {
  const changed = useNightChanged()
  return useMutation({
    mutationFn: async () =>
      (await unwrap(api.POST('/v1/nights/{night}/cancel', { params: { path: { night: nightId } } }))).data,
    onSuccess: (night) => changed(night.season_id, night.id),
  })
}

export function useQuickAddPlayer() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (nickname: string) => (await unwrap(api.POST('/v1/players/quick-add', { body: { nickname } }))).data,
    onSuccess: () => client.invalidateQueries({ queryKey: ['players'] }),
  })
}

export function useSavePlayer() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...body }: { id?: number; nickname?: string; name?: string | null; email?: string | null; birth_date?: string | null; memo?: string | null; status?: 'active' | 'inactive'; archived?: boolean }) =>
      id
        ? (await unwrap(api.PATCH('/v1/players/{player}', { params: { path: { player: id } }, body }))).data
        : (await unwrap(api.POST('/v1/players', { body: body as never }))).data,
    // Everything: a player's nickname is also in the header, the standings and the results.
    onSuccess: () => client.invalidateQueries(),
  })
}

/**
 * Sets a player's photo (admins, and the player themself). The server cuts the picture and makes the photo and the
 * thumbnail from it. The picture is only shrunk here first (lib/resizeImage.ts), to send a small file.
 */
export function useSavePlayerPhoto() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async ({ playerId, image }: { playerId: number; image: Blob }) =>
      (await unwrap(api.POST('/v1/players/{player}/photo', {
        params: { path: { player: playerId } },
        // The generated type calls the file a string; it goes as a file in a form.
        body: { image: image as unknown as string },
        bodySerializer: () => {
          const form = new FormData()
          form.append('image', image, 'photo.jpg')
          return form
        },
      }))).data,
    // Everything: the image is next to the player's nickname on most screens.
    onSuccess: () => client.invalidateQueries(),
  })
}

/** Removes a player's photo and thumbnail together. */
export function useRemovePlayerPhoto() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async ({ playerId }: { playerId: number }) =>
      (await unwrap(api.DELETE('/v1/players/{player}/photo', { params: { path: { player: playerId } } }))).data,
    onSuccess: () => client.invalidateQueries(),
  })
}

/** Creates a player's login, or changes its username, role or password (admins). Returns the player with its login. */
export function useSavePlayerLogin() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async ({ playerId, ...body }: { playerId: number; username?: string; role?: 'player' | 'results_keeper' | 'admin'; password?: string }) =>
      (await unwrap(api.PUT('/v1/players/{player}/login', { params: { path: { player: playerId } }, body }))).data,
    onSuccess: () => client.invalidateQueries({ queryKey: ['players'] }),
  })
}

export function useSaveSeason() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...body }: { id?: number; name?: string; starts_on?: string; default_place_id?: number | null; buy_in?: string | null; rebuy_value?: string | null; time_chip_value?: string | null; rebuys_allowed?: number; rebuy_charges_time_chip?: boolean; allows_extra_rebuys?: boolean; house_owner_buy_in?: string | null; is_open?: boolean; is_finished?: boolean; percentages?: { position: number; percent: number }[]; schedule_weekday?: number; schedule_time?: string; schedule_every_weeks?: number; rounds?: number }) =>
      id
        ? (await unwrap(api.PATCH('/v1/seasons/{season}', { params: { path: { season: id } }, body }))).data
        : (await unwrap(api.POST('/v1/seasons', { body: body as never }))).data,
    onSuccess: () => client.invalidateQueries({ queryKey: keys.seasons }),
  })
}

export function useSavePlace() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...body }: { id?: number; name?: string; address?: string | null; archived?: boolean }) =>
      id
        ? (await unwrap(api.PATCH('/v1/places/{place}', { params: { path: { place: id } }, body }))).data
        : (await unwrap(api.POST('/v1/places', { body: body as never }))).data,
    onSuccess: () => client.invalidateQueries({ queryKey: keys.places }),
  })
}

/** The holiday table, by name. `archived` adds the archived holidays (admins). */
export function useHolidays({ archived = false }: { archived?: boolean } = {}) {
  return useQuery({
    queryKey: [...keys.holidays, { archived }],
    queryFn: async () =>
      (await unwrap(api.GET('/v1/holidays', { params: { query: { archived: archived ? 1 : undefined } as never } }))).data,
  })
}

/** One year's holidays, including the ones cancelled that year and the extras. */
export function useHolidayCalendar(year: number) {
  return useQuery({
    queryKey: keys.holidayCalendar(year),
    placeholderData: keepPreviousData,
    queryFn: async () => (await unwrap(api.GET('/v1/holiday-calendar/{year}', { params: { path: { year } } }))).data,
  })
}

/** Several years' holidays at once, for a plan that crosses a year. */
export function useHolidayCalendars(years: number[]) {
  return useQueries({
    queries: years.map((year) => ({
      queryKey: keys.holidayCalendar(year),
      queryFn: async () => (await unwrap(api.GET('/v1/holiday-calendar/{year}', { params: { path: { year } } }))).data,
    })),
    combine: (results) => ({ data: results.flatMap((r) => r.data ?? []), isPending: results.some((r) => r.isPending) }),
  })
}

/** A season's calendar: its nights and the regular nights left out because of holidays. */
export function useSeasonCalendar(seasonId: number | undefined) {
  return useQuery({
    queryKey: keys.calendar(seasonId ?? 0),
    enabled: seasonId !== undefined,
    queryFn: async () =>
      (await unwrap(api.GET('/v1/seasons/{season}/calendar', { params: { path: { season: seasonId! } } }))).data,
  })
}

/** Holidays feed the calendars and the season plans, so a change refreshes all of them. */
function useHolidaysChanged() {
  const client = useQueryClient()
  return () => {
    client.invalidateQueries({ queryKey: keys.holidays })
    client.invalidateQueries({ predicate: (q) => q.queryKey[2] === 'night-plan' || q.queryKey[2] === 'calendar' })
  }
}

export interface HolidayInput {
  id?: number
  name?: string
  scope?: 'national' | 'state' | 'city'
  month?: number | null
  day?: number | null
  easter_offset?: number | null
  first_year?: number | null
  last_year?: number | null
  archived?: boolean
}

export function useSaveHoliday() {
  const changed = useHolidaysChanged()
  return useMutation({
    mutationFn: async ({ id, ...body }: HolidayInput) =>
      id
        ? (await unwrap(api.PATCH('/v1/holidays/{holiday}', { params: { path: { holiday: id } }, body }))).data
        : (await unwrap(api.POST('/v1/holidays', { body: body as never }))).data,
    onSuccess: changed,
  })
}

/** Cancels a table holiday for one year ({year, holiday_id}) or adds an extra one ({year, date, name}). */
export function useSaveHolidayException() {
  const changed = useHolidaysChanged()
  return useMutation({
    mutationFn: async (body: { year: number; holiday_id?: number; date?: string; name?: string }) =>
      (await unwrap(api.POST('/v1/holiday-exceptions', { body }))).data,
    onSuccess: changed,
  })
}

export function useDeleteHolidayException() {
  const changed = useHolidaysChanged()
  return useMutation({
    mutationFn: async (id: number) =>
      unwrap(api.DELETE('/v1/holiday-exceptions/{exception}', { params: { path: { exception: id } } })),
    onSuccess: changed,
  })
}

/** The season planner's dates between two days (Y-m-d), stopping after `count` planned nights if given. Nothing is saved. */
export function useNightPlan(seasonId: number, from: string, to: string, count?: number) {
  return useQuery({
    queryKey: keys.nightPlan(seasonId, from, to, count),
    enabled: seasonId > 0 && from !== '' && to !== '',
    retry: false,
    queryFn: async () =>
      (await unwrap(api.GET('/v1/seasons/{season}/night-plan', { params: { path: { season: seasonId }, query: { from, to, count } } }))).data,
  })
}

/** Schedules the chosen dates, all or none. */
export function useScheduleNights(seasonId: number) {
  const changed = useNightChanged()
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (startsAt: string[]) =>
      (await unwrap(api.POST('/v1/seasons/{season}/nights/batch', { params: { path: { season: seasonId } }, body: { starts_at: startsAt } }))).data,
    onSuccess: () => {
      changed(seasonId)
      client.invalidateQueries({ queryKey: keys.seasons })
    },
  })
}

export function useSimulate(seasonId: number) {
  return useMutation({
    mutationFn: async (body: { pot: string; positions: { position: number; player_id: number }[] }) =>
      (await unwrap(api.POST('/v1/seasons/{season}/simulate', { params: { path: { season: seasonId } }, body }))).data,
  })
}

export function useAuditLog(page: number) {
  return useQuery({
    queryKey: keys.audit(page),
    placeholderData: keepPreviousData,
    queryFn: async () => unwrap(api.GET('/v1/audit-log', { params: { query: { page } as never } })),
  })
}
