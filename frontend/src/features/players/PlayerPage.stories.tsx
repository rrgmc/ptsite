import type { Meta, StoryObj } from '@storybook/react-vite'
import { http, HttpResponse } from 'msw'
import { keeper, memo, players } from '@/mocks/data'
import { handlers } from '@/mocks/handlers'
import { RouterStory } from '@/mocks/RouterStory'
import { AllTimePlayerPage, PlayerPage } from './PlayerPage'

// A player's page: the profile, the memo and the player's statistics, for the selected season ("Temporada") or
// every season ("Geral").
const meta = { title: 'Screens/Player page', parameters: { layout: 'fullscreen' } } satisfies Meta
export default meta

const season = (id: number) => <RouterStory path="/players/:playerId" url={`/players/${id}`} element={<PlayerPage />} />
const player = (id: number, extra: object) => http.get(`/api/v1/players/${id}`, () => HttpResponse.json({ data: { ...players[id - 1], memo: null, ...extra } }))

/** Ana, who has a photo and a memo, in the selected season. */
export const Season: StoryObj = { render: () => season(1) }

/** Every season: the position overall, a line for each season, one step per season on the line chart. */
export const AllTime: StoryObj = {
  render: () => <RouterStory path="/players/:playerId/all" url="/players/1/all" element={<AllTimePlayerPage />} />,
}

/** An inactive player with no image and no memo, who did not score. */
export const NeverScored: StoryObj = { render: () => season(12) }

/** The player's own page: the email and the birthday, and the way to "Meu perfil". The mocked user is Joana. */
export const OwnPage: StoryObj = {
  parameters: { msw: [player(10, { email: 'joana@example.com', birth_date: '1990-05-17' }), ...handlers] },
  render: () => season(10),
}

/** An admin sees every player's contact details, and "Editar". */
export const AsAdmin: StoryObj = {
  parameters: {
    msw: [
      http.get('/api/v1/me', () => HttpResponse.json({ data: { ...keeper, role: 'admin', player: null, abilities: { ...keeper.abilities, manage_players: true } } })),
      player(1, { memo, email: 'ana@example.com', birth_date: '1985-11-02' }),
      ...handlers,
    ],
  },
  render: () => season(1),
}

/** A memo of the full 2000 characters, with a word too long for the line. */
export const LongMemo: StoryObj = {
  parameters: { msw: [player(3, { memo: `${'Carlão joga todas as mãos e reclama de todas. '.repeat(42)}\n${'a'.repeat(110)}` }), ...handlers] },
  render: () => season(3),
}

export const NotFound: StoryObj = {
  parameters: { msw: [http.get('/api/v1/players/999', () => HttpResponse.json({ message: 'Não encontrado.' }, { status: 404 })), ...handlers] },
  render: () => season(999),
}
