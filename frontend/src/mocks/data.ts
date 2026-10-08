import type { Attendance, CalendarEntry, CalendarHoliday, Holiday, Night, NightDashboard, PartialResult, Player, PlayerStatistics, PlannedDate, RankedList, Season, SeasonTopStandings, Standing, Statistics, User } from '@/api/client'
import { recalculated } from '@/features/dashboard/dashboardMoney'

// Invented data for Storybook and component tests. The development database has the demo league (backend/database/seeders/DemoLeagueSeeder.php).

const nicknames = ['Ana', 'Breno', 'Carlão', 'Dudu', 'Estela', 'Fausto', 'Guga', 'Helena', 'Iuri', 'Joana', 'Kiko', 'Lia']

export const players: Player[] = nicknames.map((nickname, i) => ({
  id: i + 1,
  nickname,
  name: `${nickname} da Silva`,
  status: i < 10 ? 'active' : 'inactive',
  archived: false,
  // As in the real data, only some players have images. The mocked API draws them (handlers.ts).
  thumbnail_version: i < 4 ? 'mock' : null,
  photo_version: i < 2 ? 'mock' : null,
  updated_at: '2026-03-14T21:00:00-03:00',
}))

export const place = { id: 1, name: 'Casa do Breno', address: 'Rua das Flores, 123', archived: false }
export const places = [
  place,
  { id: 2, name: 'Bar do Zé', address: 'Avenida Central, 45', archived: false },
  { id: 3, name: 'Salão do Clube', address: null, archived: true },
]

export const season: Season = {
  id: 1,
  name: 'Liga 2026',
  starts_on: '2026-04-01',
  description: null,
  buy_in: '50.00',
  rebuy_value: '50.00',
  time_chip_value: '5.00',
  rebuys_allowed: 2,
  rebuy_charges_time_chip: true,
  allows_extra_rebuys: true,
  house_owner_buy_in: '25.00',
  main_event_pot_percent: 20,
  rounds: 26,
  nights_planned: 2,
  is_open: true,
  is_finished: false,
  archived: false,
  schedule: { weekday: 5, time: '21:30', every_weeks: 2 },
  default_place: place,
  percentages: [38, 23, 15, 11, 8, 5].map((percent, i) => ({ position: i + 1, percent })),
  nights_count: 2,
  updated_at: '2026-04-01T00:00:00-03:00',
}

/** The current season, then older ones: two finished and one closed before it ended. */
export const seasons: Season[] = [
  season,
  { ...season, id: 2, name: 'Liga 2025', starts_on: '2025-03-07', is_open: false, is_finished: true, nights_planned: 26, nights_count: 26 },
  { ...season, id: 3, name: 'Liga 2024', starts_on: '2024-03-01', is_open: false, is_finished: true, nights_planned: 26, nights_count: 26 },
  { ...season, id: 4, name: 'Liga Verão 2023', starts_on: '2023-12-01', is_open: false, is_finished: false, nights_planned: 1, nights_count: 1 },
]

const points = ['114.00', '69.00', '45.00', '33.00', '24.00', '15.00']

export const finishedNight: Night = {
  id: 10,
  season_id: 1,
  starts_at: '2026-04-11T21:00:00-03:00',
  status: 'finished',
  type: 'regular',
  is_extra: false,
  description: null,
  pot: '300.00',
  main_event_pot: '60.00',
  time_chip: '20.00',
  archived: false,
  place,
  results: points.map((p, i) => ({ position: i + 1, points: p, player: players[i] })),
  main_event_positions: [],
  updated_at: '2026-04-11T23:59:00-03:00',
}

/** A parallel table on the day of a round: an extra night, which scores but is not a round. */
export const extraNight: Night = { ...finishedNight, id: 12, is_extra: true, description: 'Mesa paralela', pot: '240.00', main_event_pot: '0.00', time_chip: '0.00' }

/** A finished Main Event night: nine players in finishing order, with no pot and no points. */
export const mainEventNight: Night = {
  ...finishedNight,
  id: 13,
  starts_at: '2026-12-12T13:00:00-03:00',
  type: 'main_event',
  is_extra: true,
  pot: null,
  main_event_pot: null,
  time_chip: null,
  results: [],
  main_event_positions: [2, 0, 7, 4, 1, 9, 3, 5, 6].map((index, i) => ({ position: i + 1, player: players[index] })),
}

/** The Main Event night before it is played: open, taking the answers. */
export const openMainEventNight: Night = { ...mainEventNight, id: 14, status: 'open', main_event_positions: [] }

export const openNight: Night = {
  ...finishedNight,
  id: 11,
  starts_at: '2026-04-18T21:00:00-03:00',
  status: 'open',
  pot: null,
  main_event_pot: null,
  time_chip: null,
  results: [],
}

export const emptyPartialResult: PartialResult = { pot: null, main_event_pot: null, time_chip: null, positions: [], saved_by: null, saved_at: null }

/** The open night so far: the pot and the two players already out. */
export const partialResult: PartialResult = {
  pot: '840.00',
  main_event_pot: null,
  time_chip: '40.00',
  positions: [{ position: 5, player: players[3] }, { position: 6, player: players[1] }],
  saved_by: { id: 2, name: 'Carla' },
  saved_at: '2026-04-18T22:40:00-03:00',
}

const noAmounts = { owed: '0.00', paid: '0.00', pending: '0.00' }
const dashboardLine = (player: Player, marks: Partial<NightDashboard['players'][number]> = {}): NightDashboard['players'][number] => ({
  player,
  is_house_owner: false,
  buy_in: '0.00',
  buy_in_paid: false,
  time_chip: false,
  time_chip_paid: false,
  rebuys: [],
  ...noAmounts,
  ...marks,
})

/**
 * The open night's dashboard: the night of the example in docs/specs/night-dashboard.md, at Estela's house. The
 * amounts are worked out from the players, as the API does.
 */
export const nightDashboard: NightDashboard = recalculated({
  night_id: 11,
  status: 'open',
  can_edit: true,
  prices: { buy_in: '50.00', house_owner_buy_in: '25.00', rebuy_value: '50.00', time_chip_value: '5.00', rebuys_allowed: 2, allows_extra_rebuys: true, rebuy_charges_time_chip: true, fixed: false },
  house_owner: players[4],
  players: [
    dashboardLine(players[0], { buy_in_paid: true, rebuys: [{ id: 1, paid: true }] }),
    dashboardLine(players[1], { buy_in_paid: true, rebuys: [{ id: 2, paid: true }, { id: 3, paid: true }, { id: 4, paid: false }] }),
    dashboardLine(players[2], { time_chip: true, time_chip_paid: true }),
    dashboardLine(players[3]),
    dashboardLine(players[4], { buy_in_paid: true }),
  ],
  positions: [{ position: 6, player: players[3] }],
  main_event_pot: null,
  suggested_main_event_pot: '85.00',
  totals: { pot: noAmounts, time_chip: noAmounts, total: noAmounts },
  manual: { pot: null, time_chip: null },
  recorded: null,
  read_at: '2026-04-18T22:41:00-03:00',
})

/** The same night once it is finished: the keeper rounded the pot, and Breno's last rebuy is still not paid. */
export const finishedNightDashboard: NightDashboard = {
  ...nightDashboard,
  status: 'finished',
  can_edit: false,
  prices: { ...nightDashboard.prices, fixed: true },
  positions: [],
  suggested_main_event_pot: null,
  recorded: { pot: '430.00', main_event_pot: '85.00', time_chip: '25.00' },
}

/** A standing row's times in each scoring position, the 1st place first. */
const timesIn = (...counts: number[]) => counts.map((count, i) => ({ position: i + 1, count }))

export const standings: Standing[] = [
  { rank: 1, player: players[1], points: '183.00', nights_scored: 2, wins: 1, positions: timesIn(1, 1, 0, 0, 0, 0) },
  { rank: 2, player: players[0], points: '159.00', nights_scored: 2, wins: 1, positions: timesIn(1, 0, 1, 0, 0, 0) },
  { rank: 3, player: players[2], points: '90.00', nights_scored: 2, wins: 0, positions: timesIn(0, 1, 0, 0, 1, 0) },
  { rank: 3, player: players[3], points: '90.00', nights_scored: 2, wins: 0, positions: timesIn(0, 0, 1, 1, 0, 0) },
  { rank: 5, player: players[4], points: '48.00', nights_scored: 1, wins: 0, positions: timesIn(0, 0, 0, 1, 0, 0) },
  { rank: 6, player: players[5], points: '15.00', nights_scored: 1, wins: 0, positions: timesIn(0, 0, 0, 0, 0, 1) },
]

export const keeper: User = {
  id: 1,
  username: 'maria',
  name: 'Maria',
  role: 'results_keeper',
  player: players[9],
  abilities: {
    run_nights: true,
    edit_played_nights: false,
    save_partial_results: true,
    answer_for_others: true,
    quick_add_players: true,
    manage_players: false,
    manage_seasons: false,
    manage_places: false,
    view_audit_log: false,
  },
}

export const attendances: Attendance[] = [
  { player: players[0], answer: 'all_in', answered_at: '2026-04-13T10:00:00-03:00', answered_by: null },
  { player: players[1], answer: 'all_in', answered_at: '2026-04-13T11:00:00-03:00', answered_by: null },
  { player: players[2], answer: 'fold', answered_at: '2026-04-13T12:00:00-03:00', answered_by: null },
  { player: players[3], answer: 'all_in', answered_at: '2026-04-14T09:00:00-03:00', answered_by: { id: 1, name: 'Maria' } },
]

/** The season planner for 2027 (Easter on 28/03): every other Friday, with the three kinds of skipped dates. */
const friday = (dayMonth: string) => `2027-${dayMonth}T21:30:00-03:00`
export const nightPlan: PlannedDate[] = [
  { starts_at: friday('01-22'), included: false, taken: true, night_id: 11, skip_reason: null },
  { starts_at: friday('02-05'), included: false, taken: false, night_id: null, skip_reason: { kind: 'carnival', holiday: 'Carnaval' } },
  { starts_at: friday('02-12'), included: true, taken: false, night_id: null, skip_reason: null },
  { starts_at: friday('02-26'), included: true, taken: false, night_id: null, skip_reason: null },
  { starts_at: friday('03-12'), included: true, taken: false, night_id: null, skip_reason: null },
  { starts_at: friday('03-26'), included: false, taken: false, night_id: null, skip_reason: { kind: 'holiday', holiday: 'Sexta-feira Santa' } },
  { starts_at: friday('04-02'), included: true, taken: false, night_id: null, skip_reason: null },
  { starts_at: friday('04-16'), included: true, taken: false, night_id: null, skip_reason: null },
  { starts_at: friday('04-30'), included: true, taken: false, night_id: null, skip_reason: null },
  { starts_at: friday('05-14'), included: true, taken: false, night_id: null, skip_reason: null },
  { starts_at: friday('05-28'), included: false, taken: false, night_id: null, skip_reason: { kind: 'bridge', holiday: 'Corpus Christi' } },
  { starts_at: friday('06-04'), included: true, taken: false, night_id: null, skip_reason: null },
]

const holiday = (id: number, name: string, scope: Holiday['scope'], rule: Partial<Holiday>): Holiday => ({
  id, name, scope, month: null, day: null, easter_offset: null, first_year: null, last_year: null, archived: false, ...rule,
})
export const holidays: Holiday[] = [
  holiday(1, 'Carnaval', 'national', { easter_offset: -47 }),
  holiday(2, 'Corpus Christi', 'city', { easter_offset: 60 }),
  holiday(3, 'Consciência Negra', 'national', { month: 11, day: 20, first_year: 2024 }),
  holiday(4, 'Sexta-feira Santa', 'national', { easter_offset: -2 }),
  holiday(5, 'Tiradentes', 'national', { month: 4, day: 21 }),
  holiday(6, 'Aniversário da liga', 'city', { month: 3, day: 14, archived: true }),
]

export const holidayCalendar2027: CalendarHoliday[] = [
  { date: '2027-02-09', name: 'Carnaval', scope: 'national', holiday_id: 1, cancelled: false, exception_id: null },
  { date: '2027-03-26', name: 'Sexta-feira Santa', scope: 'national', holiday_id: 4, cancelled: false, exception_id: null },
  { date: '2027-04-21', name: 'Tiradentes', scope: 'national', holiday_id: 5, cancelled: false, exception_id: null },
  { date: '2027-05-27', name: 'Corpus Christi', scope: 'city', holiday_id: 2, cancelled: true, exception_id: 7 },
  { date: '2027-06-11', name: 'Jogo do Brasil', scope: null, holiday_id: null, cancelled: false, exception_id: 8 },
  { date: '2027-11-20', name: 'Consciência Negra', scope: 'national', holiday_id: 3, cancelled: false, exception_id: null },
]

/** A season calendar: finished nights with winners, the next ones, and the Fridays left out for holidays. */
const night = (id: number, dayMonth: string, status: 'scheduled' | 'open' | 'finished', extra: Partial<NonNullable<CalendarEntry['night']>> = {}): CalendarEntry => ({
  kind: 'night',
  starts_at: friday(dayMonth),
  night: { id, status, type: 'regular', is_extra: false, place: 'Casa do Breno', winner: null, pot: null, all_in_count: 0, my_answer: null, ...extra },
  skip_reason: null,
})
const noNight = (dayMonth: string, kind: 'holiday' | 'bridge' | 'carnival', holiday: string): CalendarEntry => ({
  kind: 'no_night', starts_at: friday(dayMonth), night: null, skip_reason: { kind, holiday },
})
export const seasonCalendar: CalendarEntry[] = [
  noNight('01-01', 'holiday', 'Confraternização Universal'),
  night(1, '01-08', 'finished', { winner: 'Ana', pot: '840.00' }),
  night(2, '01-22', 'finished', { winner: 'Carlão', pot: '795.00' }),
  noNight('02-05', 'carnival', 'Carnaval'),
  night(3, '02-12', 'finished', { winner: 'Ana', pot: '810.00' }),
  night(4, '02-26', 'finished', { winner: 'Helena', pot: '900.00' }),
  night(5, '03-12', 'scheduled', { all_in_count: 7, my_answer: 'all_in' }),
  noNight('03-26', 'holiday', 'Sexta-feira Santa'),
  night(6, '04-02', 'scheduled', { all_in_count: 2 }),
]

const playerList = (values: [player: number, rank: number, value: number][], key: 'count' | 'amount', extra: Partial<RankedList> = {}): RankedList => ({
  position: null,
  rows: values.map(([player, rank, value]) => ({
    rank,
    player: players[player],
    night: null,
    place: null,
    count: key === 'count' ? value : null,
    amount: key === 'amount' ? value.toFixed(2) : null,
  })),
  tied_not_shown: 0,
  ...extra,
})

/** The medal table: each player's times in the 1st, 2nd and 3rd place. */
const positionTable = (lines: [player: number, rank: number, counts: number[]][]): Statistics['position_table'] =>
  lines.map(([player, rank, counts]) => ({ rank, player: players[player], positions: counts.map((count, i) => ({ position: i + 1, count })) }))

const potNight = (id: number, day: string, seasonName: string) => ({ id, starts_at: `${day}T21:30:00-03:00`, season_id: 1, season_name: seasonName })

/** One season: five nights, with ties in the lists and a cut tie in "Posição: 3º". */
export const statistics: Statistics = {
  season_id: 1,
  nights_count: 5,
  pot_total: '4145.00',
  main_event_pot_total: '300.00',
  time_chip_total: '120.00',
  total_points: playerList([[0, 1, 986.3], [2, 2, 742.1], [7, 3, 615], [1, 4, 498.75], [3, 5, 352], [4, 6, 301.4], [5, 7, 248], [6, 8, 190.2], [8, 9, 121], [9, 10, 90.25]], 'amount'),
  nights_scored: playerList([[0, 1, 5], [2, 1, 5], [1, 3, 4], [7, 3, 4], [3, 5, 3], [4, 5, 3], [5, 7, 2], [6, 7, 2], [8, 9, 1], [9, 9, 1]], 'count', { tied_not_shown: 2 }),
  positions: [
    playerList([[0, 1, 2], [2, 2, 1], [7, 2, 1], [1, 2, 1]], 'count', { position: 1 }),
    playerList([[2, 1, 2], [0, 2, 1], [3, 2, 1], [4, 2, 1]], 'count', { position: 2 }),
    playerList([[1, 1, 1], [3, 1, 1], [5, 1, 1], [6, 1, 1], [7, 1, 1]], 'count', { position: 3 }),
  ],
  biggest_pots: {
    position: null,
    rows: [
      { rank: 1, player: null, night: potNight(4, '2026-05-15', 'Liga 2026'), place: null, count: null, amount: '900.00' },
      { rank: 2, player: null, night: potNight(1, '2026-04-03', 'Liga 2026'), place: null, count: null, amount: '840.00' },
      { rank: 2, player: null, night: potNight(5, '2026-05-29', 'Liga 2026'), place: null, count: null, amount: '840.00' },
      { rank: 4, player: null, night: potNight(3, '2026-05-01', 'Liga 2026'), place: null, count: null, amount: '810.00' },
      { rank: 5, player: null, night: potNight(2, '2026-04-17', 'Liga 2026'), place: null, count: null, amount: '755.00' },
    ],
    tied_not_shown: 0,
  },
  places: {
    position: null,
    rows: [
      { rank: 1, player: null, night: null, place: { id: 1, name: 'Casa do Carlão' }, count: 3, amount: null },
      { rank: 2, player: null, night: null, place: { id: 2, name: 'Bar do Zé' }, count: 2, amount: null },
    ],
    tied_not_shown: 0,
  },
  points_progress: {
    steps: ['2026-04-03', '2026-04-17', '2026-05-01', '2026-05-15', '2026-05-29'].map((day, i) => ({ night_id: i + 1, starts_at: `${day}T21:30:00-03:00`, season_id: 1, season_name: 'Liga 2026' })),
    series: [
      { player: players[0], points: ['319.20', '319.20', '627.00', '834.00', '986.30'] },
      { player: players[2], points: ['193.20', '480.10', '480.10', '615.10', '742.10'] },
      { player: players[7], points: ['0.00', '113.25', '299.55', '299.55', '615.00'] },
      { player: players[1], points: ['126.00', '241.00', '241.00', '456.75', '498.75'] },
      { player: players[3], points: ['92.40', '92.40', '213.90', '352.00', '352.00'] },
      { player: players[4], points: ['67.20', '180.45', '180.45', '301.40', '301.40'] },
      { player: players[5], points: ['0.00', '0.00', '121.50', '121.50', '248.00'] },
      { player: players[6], points: ['42.00', '42.00', '42.00', '190.20', '190.20'] },
    ],
    pots: ['840.00', '755.00', '810.00', '900.00', '840.00'],
  },
  wins_not_shown: 0,
  position_table: positionTable([
    [0, 1, [2, 1, 0]], [2, 2, [1, 2, 0]], [1, 3, [1, 0, 1]], [7, 3, [1, 0, 1]], [3, 5, [0, 1, 1]], [4, 6, [0, 1, 0]],
    [5, 7, [0, 0, 1]], [6, 7, [0, 0, 1]], [8, 7, [0, 0, 1]], [9, 7, [0, 0, 1]], [10, 7, [0, 0, 1]], [11, 7, [0, 0, 1]],
  ]),
  // The season's own Main Event. The screen lists the Main Events only over every season.
  main_event: {
    count: 1,
    titles: playerList([[2, 1, 1]], 'count'),
    podiums: playerList([[0, 1, 1], [2, 1, 1], [7, 1, 1]], 'count'),
    appearances: playerList([[0, 1, 1], [1, 1, 1], [2, 1, 1], [3, 1, 1], [7, 1, 1]], 'count'),
  },
}

/** Every season: one step per season, the season named under each pot, and first places left out of the list. */
export const statisticsAllTime: Statistics = {
  ...statistics,
  season_id: null,
  nights_count: 79,
  pot_total: '61320.00',
  main_event_pot_total: '4740.00',
  time_chip_total: '120.00',
  biggest_pots: {
    ...statistics.biggest_pots,
    rows: statistics.biggest_pots.rows.map((row, i) => ({ ...row, night: { ...row.night!, season_name: ['Liga 2026', 'Liga 2025', 'Liga 2025', 'Liga 2024', 'Liga 2026'][i] } })),
  },
  positions: [
    playerList([[0, 1, 14], [2, 2, 11], [7, 3, 9], [1, 4, 8], [3, 5, 7], [4, 5, 7], [5, 7, 5], [6, 8, 4], [8, 9, 3], [9, 9, 3]], 'count', { position: 1, tied_not_shown: 1 }),
    ...statistics.positions.slice(1),
  ],
  points_progress: {
    steps: [[3, 'Liga 2024'], [2, 'Liga 2025'], [1, 'Liga 2026']].map(([id, name]) => ({ night_id: null, starts_at: null, season_id: id as number, season_name: name as string })),
    series: [
      { player: players[0], points: ['5210.40', '9980.10', '10966.40'] },
      { player: players[2], points: ['4100.00', '9120.75', '9862.85'] },
      { player: players[7], points: ['3890.20', '7001.00', '7616.00'] },
      { player: players[1], points: ['2950.00', '6480.30', '6979.05'] },
      { player: players[3], points: ['0.00', '4120.00', '4472.00'] },
      { player: players[4], points: ['2210.00', '3640.50', '3941.90'] },
      { player: players[5], points: ['1980.75', '2890.00', '3138.00'] },
      { player: players[6], points: ['1400.00', '1400.00', '1590.20'] },
    ],
    pots: ['27300.00', '29875.00', '4145.00'],
  },
  wins_not_shown: 8,
  // Three Main Events, with ties in every list.
  main_event: {
    count: 3,
    titles: playerList([[2, 1, 2], [0, 2, 1]], 'count'),
    podiums: playerList([[0, 1, 3], [2, 1, 3], [7, 3, 2], [1, 4, 1]], 'count'),
    appearances: playerList([[0, 1, 3], [2, 1, 3], [7, 1, 3], [1, 4, 2], [3, 4, 2], [4, 4, 2], [5, 7, 1], [6, 7, 1], [8, 7, 1], [9, 7, 1]], 'count', { tied_not_shown: 1 }),
  },
}

export const statisticsEmpty: Statistics = {
  season_id: 1,
  nights_count: 0,
  pot_total: '0.00',
  main_event_pot_total: '0.00',
  time_chip_total: '0.00',
  total_points: playerList([], 'amount'),
  nights_scored: playerList([], 'count'),
  positions: [],
  biggest_pots: playerList([], 'amount'),
  places: playerList([], 'count'),
  points_progress: { steps: [], series: [], pots: [] },
  wins_not_shown: 0,
  position_table: [],
  main_event: null,
}

/** The memo an admin wrote about Ana, with a line break. */
export const memo = 'Fundadora da mesa, joga desde 2009.\nNunca recusa um all-in antes do intervalo.'

/** The memos in the players list, by player: Ana (1), Carlão (3) and Lia (12). The other players have none. */
export const memos: Record<number, string> = {
  1: memo,
  3: 'Joga todas as mãos e reclama de todas.',
  12: 'Prometeu voltar em 2019. A cadeira continua guardada.',
}

const playerResult = (nightId: number, day: string, seasonId: number, seasonName: string, position: number, points: string) => ({
  night_id: nightId,
  starts_at: `${day}T21:30:00-03:00`,
  season_id: seasonId,
  season_name: seasonName,
  position,
  points,
})

/** Ana in one season: first in the standings, and no points on the second night. */
/** The first ten of a finished season, with a shared 4th place. */
export const topTen: Standing[] = ['1420.50', '1310.00', '1188.25', '960.00', '960.00', '845.75', '702.00', '655.50', '590.00', '412.25'].map((points, i) => ({
  rank: i === 4 ? 4 : i + 1,
  player: players[i],
  points,
  nights_scored: 20 - i,
  wins: Math.max(0, 5 - i),
  positions: timesIn(Math.max(0, 5 - i), 4, 3, 3, 3, 2 + (i % 3)),
}))

/** "Temporadas": the current season so far, two finished seasons (one with a cut tie) and one with no result. */
export const seasonsTopStandings: SeasonTopStandings[] = [
  { season: seasons[0], rows: standings, tied_not_shown: 0, main_event_champion: null },
  { season: seasons[1], rows: topTen, tied_not_shown: 2, main_event_champion: players[2] },
  { season: seasons[2], rows: [...topTen.slice(5), ...topTen.slice(0, 5)].map((row, i) => ({ ...row, rank: i + 1, points: topTen[i].points })), tied_not_shown: 0, main_event_champion: players[7] },
  { season: { ...seasons[3], nights_count: 0 }, rows: [], tied_not_shown: 0, main_event_champion: null },
]

export const playerStatistics: PlayerStatistics = {
  season_id: 1,
  rank: 1,
  points: '986.30',
  nights_scored: 4,
  wins: 2,
  positions: [2, 1, 0, 1, 0, 0].map((count, i) => ({ position: i + 1, count })),
  seasons: [{ season_id: 1, season_name: 'Liga 2026', rank: 1, points: '986.30', nights_scored: 4, wins: 2 }],
  results: [
    playerResult(5, '2026-05-29', 1, 'Liga 2026', 4, '152.30'),
    playerResult(4, '2026-05-15', 1, 'Liga 2026', 2, '207.00'),
    playerResult(3, '2026-05-01', 1, 'Liga 2026', 1, '307.80'),
    playerResult(1, '2026-04-03', 1, 'Liga 2026', 1, '319.20'),
  ],
  points_progress: { steps: statistics.points_progress.steps, points: statistics.points_progress.series[0].points },
}

/** Ana over every season: a line for each season, and the season named under each night. */
export const playerStatisticsAllTime: PlayerStatistics = {
  season_id: null,
  rank: 1,
  points: '10966.40',
  nights_scored: 61,
  wins: 14,
  positions: [14, 12, 11, 9, 8, 7].map((count, i) => ({ position: i + 1, count })),
  seasons: [
    { season_id: 1, season_name: 'Liga 2026', rank: 1, points: '986.30', nights_scored: 4, wins: 2 },
    { season_id: 2, season_name: 'Liga 2025', rank: 2, points: '4769.70', nights_scored: 29, wins: 7 },
    { season_id: 3, season_name: 'Liga 2024', rank: 1, points: '5210.40', nights_scored: 28, wins: 5 },
  ],
  results: [
    ...playerStatistics.results,
    playerResult(78, '2025-11-28', 2, 'Liga 2025', 1, '342.00'),
    playerResult(40, '2024-12-06', 3, 'Liga 2024', 3, '120.00'),
  ],
  points_progress: { steps: statisticsAllTime.points_progress.steps, points: statisticsAllTime.points_progress.series[0].points },
}

/** A player who did not score: zeros, no position and a flat line. */
export const playerStatisticsEmpty: PlayerStatistics = {
  season_id: 1,
  rank: null,
  points: '0.00',
  nights_scored: 0,
  wins: 0,
  positions: [1, 2, 3, 4, 5, 6].map((position) => ({ position, count: 0 })),
  seasons: [],
  results: [],
  points_progress: { steps: statistics.points_progress.steps, points: statistics.points_progress.steps.map(() => '0.00') },
}
