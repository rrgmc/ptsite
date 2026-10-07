import type { Meta, StoryObj } from '@storybook/react-vite'
import { http, HttpResponse } from 'msw'
import { handlers } from '@/mocks/handlers'
import { players } from '@/mocks/data'
import { PlayerLoginForm } from './PlayerLoginForm'

// "Acesso ao site" on a player's admin screen. The logged-in user in the mocks is Maria (players[9]).
const meta = { title: 'Admin/Player login', component: PlayerLoginForm, parameters: { layout: 'padded' } } satisfies Meta<typeof PlayerLoginForm>
export default meta

/** A player with a login: pick another role or set a new password. */
export const WithLogin: StoryObj<typeof meta> = {
  args: { player: { ...players[0], login: { username: 'ana', role: 'player', last_login_at: '2026-09-20T22:10:00-03:00' } } },
}

/** A quick-added player with no login yet: username, password and role. */
export const WithoutLogin: StoryObj<typeof meta> = {
  args: { player: { ...players[2], login: null } },
}

/** Your own player: the role can't be changed, only the password. */
export const OwnLogin: StoryObj<typeof meta> = {
  args: { player: { ...players[9], login: { username: 'maria', role: 'results_keeper', last_login_at: null } } },
}

/** The API refuses the username. */
export const UsernameTaken: StoryObj<typeof meta> = {
  args: { player: { ...players[2], login: null } },
  parameters: {
    msw: [
      http.put('/api/v1/players/:id/login', () =>
        HttpResponse.json({ message: 'Já existe um acesso com este usuário.', rule: 'account.username_taken', errors: { username: ['Já existe um acesso com este usuário.'] } }, { status: 422 }),
      ),
      ...handlers,
    ],
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText(/Senha/), 'mesa-verde-7')
    await userEvent.click(canvas.getByRole('button', { name: 'Criar acesso' }))
    await canvas.findByText('Já existe um acesso com este usuário.')
  },
}
