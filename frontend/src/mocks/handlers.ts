import { http, HttpResponse } from 'msw'
import { attendances, emptyPartialResult, seasonCalendar, finishedNight, holidayCalendar2027, holidays, keeper, mainEventNight, memo, memos, nightPlan, openMainEventNight, openNight, places, players, playerStatistics, playerStatisticsAllTime, playerStatisticsEmpty, season, seasons, seasonsTopStandings, standings, statistics, statisticsAllTime } from './data'

const withArchived = (request: Request) => new URL(request.url).searchParams.get('archived') === '1'

// A mocked API with the same shapes as the real one (see openapi.json), for Storybook.
export const handlers = [
  http.get('/api/v1/me', () => HttpResponse.json({ data: keeper })),
  http.put('/api/v1/me/password', () => new HttpResponse(null, { status: 204 })),
  http.get('/sanctum/csrf-cookie', () => new HttpResponse(null, { status: 204 })),
  http.post('/api/v1/password-resets', () => HttpResponse.json({ data: { email: 'm•••@gmail.com' } })),
  http.get('/api/v1/password-resets/:token', () => HttpResponse.json({ data: { username: 'maria', expires_at: '2026-10-04T21:00:00-03:00' } })),
  http.post('/api/v1/password-resets/:token/complete', () => new HttpResponse(null, { status: 204 })),
  http.get('/api/v1/seasons', () => HttpResponse.json({ data: seasons })),
  http.get('/api/v1/seasons/current', () => HttpResponse.json({ data: season })),
  http.get('/api/v1/seasons/top-standings', () => HttpResponse.json({ data: seasonsTopStandings })),
  http.get('/api/v1/seasons/:id', ({ params }) => {
    const found = seasons.find((s) => s.id === Number(params.id))
    return found ? HttpResponse.json({ data: found }) : HttpResponse.json({ message: 'Temporada não encontrada.' }, { status: 404 })
  }),
  http.get('/api/v1/seasons/:id/standings', () => HttpResponse.json({ data: standings })),
  http.get('/api/v1/statistics', ({ request }) =>
    HttpResponse.json({ data: new URL(request.url).searchParams.has('season') ? statistics : statisticsAllTime }),
  ),
  http.get('/api/v1/seasons/:id/night-suggestions', () =>
    HttpResponse.json({
      data: [
        { starts_at: '2026-04-24T21:30:00-03:00' },
        { starts_at: '2026-05-01T21:30:00-03:00' },
        { starts_at: '2026-05-08T21:30:00-03:00' },
      ],
    }),
  ),
  http.get('/api/v1/seasons/:id/calendar', () => HttpResponse.json({ data: seasonCalendar })),
  http.get('/api/v1/seasons/:id/night-plan', () => HttpResponse.json({ data: nightPlan })),
  http.post('/api/v1/seasons/:id/nights/batch', async ({ request }) => {
    const { starts_at } = (await request.json()) as { starts_at: string[] }
    return HttpResponse.json({ data: starts_at.map((s, i) => ({ ...openNight, id: 100 + i, starts_at: s, status: 'scheduled' })) }, { status: 201 })
  }),
  http.get('/api/v1/holidays', ({ request }) => HttpResponse.json({ data: holidays.filter((h) => !h.archived || withArchived(request)) })),
  http.patch('/api/v1/holidays/:id', async ({ params, request }) => {
    const holiday = holidays.find((h) => h.id === Number(params.id)) ?? holidays[0]
    return HttpResponse.json({ data: { ...holiday, ...((await request.json()) as object) } })
  }),
  http.get('/api/v1/holiday-calendar/:year', () => HttpResponse.json({ data: holidayCalendar2027 })),
  http.get('/api/v1/seasons/:id/nights', () => HttpResponse.json({ data: [finishedNight, openNight] })),
  http.get('/api/v1/nights/:id/attendance', () => HttpResponse.json({ data: attendances })),
  http.put('/api/v1/nights/:id/attendance/:player', () => HttpResponse.json({ data: attendances[0] })),
  http.get('/api/v1/nights/:id/partial-result', () => HttpResponse.json({ data: emptyPartialResult })),
  http.put('/api/v1/nights/:id/partial-result', async ({ request }) => {
    const body = (await request.json()) as { pot: string | null; main_event_pot: string | null; time_chip: string | null; positions: { position: number; player_id: number }[] }
    return HttpResponse.json({
      data: {
        ...body,
        positions: body.positions.map((line) => ({ position: line.position, player: players.find((p) => p.id === line.player_id) ?? players[0] })),
        saved_by: { id: keeper.id, name: keeper.name },
        saved_at: new Date().toISOString(),
      },
    })
  }),
  http.patch('/api/v1/nights/:id', async ({ params, request }) => {
    const { place_id, ...body } = (await request.json()) as { place_id?: number | null; description?: string | null }
    const night = Number(params.id) === openNight.id ? openNight : finishedNight
    return HttpResponse.json({ data: { ...night, ...body, place: place_id === undefined ? night.place : (places.find((p) => p.id === place_id) ?? null) } })
  }),
  http.post('/api/v1/nights/:id/reschedule', async ({ request }) =>
    HttpResponse.json({ data: { ...openNight, status: 'scheduled', ...((await request.json()) as { starts_at: string }) } }),
  ),
  http.get('/api/v1/nights/:id', ({ params }) =>
    HttpResponse.json({ data: [openNight, mainEventNight, openMainEventNight].find((n) => n.id === Number(params.id)) ?? finishedNight }),
  ),
  http.post('/api/v1/nights/:id/main-event-result', async ({ request }) => {
    const { player_ids } = (await request.json()) as { player_ids: number[] }
    return HttpResponse.json({ data: { ...mainEventNight, main_event_positions: player_ids.map((id, i) => ({ position: i + 1, player: players.find((p) => p.id === id) ?? players[0] })) } })
  }),
  http.post('/api/v1/seasons/:id/main-event/import', () => HttpResponse.json({ data: mainEventNight }, { status: 201 })),
  http.get('/api/v1/players', () => HttpResponse.json({ data: players.map((p) => ({ ...p, memo: memos[p.id] ?? null })) })),
  // One handler per kind of image. MSW cannot read a pattern such as `:kind(thumbnail|photo)`: it throws on every
  // request, and then no story renders.
  ...(['thumbnail', 'photo'] as const).map((kind) =>
    // A drawn stand-in for a player's thumbnail or photo: a different shade per player, in the 3:4 shape.
    http.get(`/api/v1/players/:id/${kind}`, ({ params }) => {
      const hue = (Number(params.id) * 67) % 360
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 46 60"><rect width="46" height="60" fill="hsl(${hue} 35% 55%)"/><circle cx="23" cy="23" r="10" fill="hsl(${hue} 35% 85%)"/><rect x="7" y="38" width="32" height="30" rx="12" fill="hsl(${hue} 35% 85%)"/></svg>`
      return new HttpResponse(svg, { headers: { 'Content-Type': 'image/svg+xml' } })
    }),
  ),
  // Sending or removing the photo changes the thumbnail with it.
  http.post('/api/v1/players/:id/photo', ({ params }) => {
    const player = players.find((p) => p.id === Number(params.id)) ?? players[0]
    return HttpResponse.json({ data: { ...player, thumbnail_version: 'sent', photo_version: 'sent' } })
  }),
  http.delete('/api/v1/players/:id/photo', ({ params }) => {
    const player = players.find((p) => p.id === Number(params.id)) ?? players[0]
    return HttpResponse.json({ data: { ...player, thumbnail_version: null, photo_version: null } })
  }),
  // Ana (1) has a memo. Lia (12), who is inactive, never scored.
  http.get('/api/v1/players/:id', ({ params }) =>
    HttpResponse.json({
      data: {
        ...(players.find((p) => p.id === Number(params.id)) ?? players[0]),
        memo: Number(params.id) === 1 ? memo : null,
        login: { username: 'ana', role: 'player', last_login_at: null },
      },
    }),
  ),
  http.get('/api/v1/players/:id/statistics', ({ params, request }) => {
    if (Number(params.id) === 12) return HttpResponse.json({ data: playerStatisticsEmpty })
    return HttpResponse.json({ data: new URL(request.url).searchParams.has('season') ? playerStatistics : playerStatisticsAllTime })
  }),
  http.patch('/api/v1/players/:id', async ({ params, request }) => {
    const player = players.find((p) => p.id === Number(params.id)) ?? players[0]
    return HttpResponse.json({ data: { ...player, ...((await request.json()) as object) } })
  }),
  // Like the API: archived places only with archived=1, which the admin list sends and the place pickers do not.
  http.get('/api/v1/places', ({ request }) => HttpResponse.json({ data: places.filter((p) => !p.archived || withArchived(request)) })),
  http.patch('/api/v1/places/:id', async ({ params, request }) => {
    const place = places.find((p) => p.id === Number(params.id)) ?? places[0]
    return HttpResponse.json({ data: { ...place, ...((await request.json()) as object) } })
  }),
  http.put('/api/v1/players/:id/login', async ({ params, request }) => {
    const body = (await request.json()) as { username?: string; role?: 'player' | 'results_keeper' | 'admin' }
    const player = players.find((p) => p.id === Number(params.id)) ?? players[0]
    return HttpResponse.json({ data: { ...player, login: { username: body.username ?? 'ana', role: body.role ?? 'player', last_login_at: null } } })
  }),
  http.post('/api/v1/players/quick-add', async ({ request }) => {
    const { nickname } = (await request.json()) as { nickname: string }
    return HttpResponse.json({ data: { ...players[0], id: 99, nickname, name: null } }, { status: 201 })
  }),
  http.post('/api/v1/nights/:id/finish', () =>
    HttpResponse.json(
      {
        message: 'Este jogador já está na 1ª posição.',
        rule: 'night.result.duplicate_player',
        errors: { 'positions.3': ['Este jogador já está na 1ª posição.'] },
      },
      { status: 422 },
    ),
  ),
]
