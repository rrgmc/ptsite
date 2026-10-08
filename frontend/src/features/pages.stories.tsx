import type { Meta, StoryObj } from '@storybook/react-vite'
import { http, HttpResponse } from 'msw'
import { RouterStory } from '@/mocks/RouterStory'
import { handlers } from '@/mocks/handlers'
import { withFeatures } from '@/mocks/withFeatures'
import { extraNight, finishedNight, keeper, mainEventNight, openMainEventNight, openNight, partialResult, players, season, statisticsEmpty } from '@/mocks/data'
import { MainEventAdmin } from './admin/MainEventAdmin'
import { PlaceEditPage, PlacesAdmin } from './admin/PlacesAdmin'
import { PlayerEditPage, PlayersAdmin } from './admin/PlayersAdmin'
import { SeasonEditPage, SeasonsAdmin } from './admin/SeasonsAdmin'
import { ForgotPasswordPage } from './auth/ForgotPasswordPage'
import { LoginPage } from './auth/LoginPage'
import { ResetPasswordPage } from './auth/ResetPasswordPage'
import { ProfilePage } from './profile/ProfilePage'
import { AppLayout } from './layout/AppLayout'
import { MainEventPage } from './mainEvent/MainEventPage'
import { MainEventResultFormPage } from './mainEvent/MainEventResultFormPage'
import { NightEditPage } from './nights/NightEditPage'
import { NightPage, RescheduleForm } from './nights/NightPage'
import { PartialResultFormPage } from './nights/PartialResultFormPage'
import { ResultFormPage } from './nights/ResultFormPage'
import { ResultsPage } from './results/ResultsPage'
import { SimulatorPage } from './simulator/SimulatorPage'
import { StandingsPage } from './standings/StandingsPage'

// Whole screens with the mocked API, at phone width by default.
const meta = { title: 'Screens', parameters: { layout: 'fullscreen' } } satisfies Meta
export default meta

/** A night is open and the player has not answered, so the banner above the title offers ALL IN and FOLD. */
export const Standings: StoryObj = { render: () => <RouterStory path="/" url="/" element={<StandingsPage />} /> }

/** "Classificação" of a season whose Main Event was played: its first three are above the table. */
export const StandingsWithMainEvent: StoryObj = {
  parameters: { msw: [http.get('/api/v1/seasons/:id/nights', () => HttpResponse.json({ data: [finishedNight, mainEventNight] })), ...handlers] },
  render: () => <RouterStory path="/" url="/" element={<StandingsPage />} />,
}

/** The same banner above "Resultados", for a player who already answered: Ana is ALL IN. Then the upcoming nights, the chart and the results. */
export const Results: StoryObj = {
  parameters: { msw: [http.get('/api/v1/me', () => HttpResponse.json({ data: { ...keeper, player: players[0] } })), ...handlers] },
  render: () => <RouterStory path="/results" url="/results" element={<ResultsPage />} />,
}

/** A season with no finished night yet: "Resultados" has no chart and no result. */
export const ResultsNoFinishedNight: StoryObj = {
  parameters: {
    msw: [
      http.get('/api/v1/statistics', () => HttpResponse.json({ data: statisticsEmpty })),
      http.get('/api/v1/seasons/:id/nights', () => HttpResponse.json({ data: [openNight] })),
      ...handlers,
    ],
  },
  render: () => <RouterStory path="/results" url="/results" element={<ResultsPage />} />,
}

const seasonNights = (nights: object[]) => [http.get('/api/v1/seasons/:id/nights', () => HttpResponse.json({ data: nights })), ...handlers]

/** "Resultados" of a season with an extra night and its Main Event: neither has a number, and each is marked. */
export const ResultsWithExtraAndMainEvent: StoryObj = {
  parameters: { msw: seasonNights([finishedNight, extraNight, mainEventNight]) },
  render: () => <RouterStory path="/results" url="/results" element={<ResultsPage />} />,
}

const laterNight = (id: number, startsAt: string) => ({ ...openNight, id, status: 'scheduled', starts_at: startsAt })

/** "Resultados" of a season with three nights to come: "Próximos eventos" lists two and leads to the calendar. */
export const ResultsManyUpcoming: StoryObj = {
  parameters: {
    msw: seasonNights([finishedNight, openNight, laterNight(21, '2026-04-25T21:00:00-03:00'), laterNight(22, '2026-05-02T21:00:00-03:00')]),
  },
  render: () => <RouterStory path="/results" url="/results" element={<ResultsPage />} />,
}

/** "Resultados" of a finished season: no "Próximos eventos", even for a results keeper and with a night left over. */
export const ResultsFinishedSeason: StoryObj = {
  parameters: {
    msw: [
      http.get('/api/v1/seasons/current', () => HttpResponse.json({ data: { ...season, is_open: false, is_finished: true } })),
      http.get('/api/v1/me', () => HttpResponse.json({ data: keeper })),
      ...seasonNights([finishedNight, laterNight(21, '2026-04-25T21:00:00-03:00')]),
    ],
  },
  render: () => <RouterStory path="/results" url="/results" element={<ResultsPage />} />,
}

/** "Main Event": the season's Main Event after it was played, with the season's Main Event pot. */
export const MainEvent: StoryObj = {
  parameters: { msw: seasonNights([finishedNight, mainEventNight]) },
  render: () => <RouterStory path="/main-event" url="/main-event" element={<MainEventPage />} />,
}

/** The Main Event night is open: the screen gives its day and place and leads to the night, for the answers. */
export const MainEventNotPlayed: StoryObj = {
  parameters: { msw: seasonNights([finishedNight, openMainEventNight]) },
  render: () => <RouterStory path="/main-event" url="/main-event" element={<MainEventPage />} />,
}

/** A season with no Main Event night. */
export const MainEventNotScheduled: StoryObj = {
  render: () => <RouterStory path="/main-event" url="/main-event" element={<MainEventPage />} />,
}

/** The same screen for an admin, with the way to the season's Main Event in "Administração". */
export const MainEventAsAdmin: StoryObj = {
  parameters: { msw: [http.get('/api/v1/me', () => HttpResponse.json({ data: { ...keeper, role: 'admin', abilities: { ...keeper.abilities, manage_seasons: true } } })), ...seasonNights([finishedNight, mainEventNight])] },
  render: () => <RouterStory path="/main-event" url="/main-event" element={<MainEventPage />} />,
}

/** "Administração": a season with no Main Event. The form schedules it, or records it with its players. */
export const AdminMainEventAdd: StoryObj = {
  render: () => <RouterStory path="/admin/seasons/:seasonId/main-event" url="/admin/seasons/1/main-event" element={<MainEventAdmin />} />,
}

/** "Administração": the Main Event of a season after it was played, with the ways to its night and its result. */
export const AdminMainEventPlayed: StoryObj = {
  parameters: { msw: seasonNights([finishedNight, mainEventNight]) },
  render: () => <RouterStory path="/admin/seasons/:seasonId/main-event" url="/admin/seasons/1/main-event" element={<MainEventAdmin />} />,
}

/** "Administração": the Main Event night is open, so its result can be entered. */
export const AdminMainEventOpen: StoryObj = {
  parameters: { msw: seasonNights([finishedNight, openMainEventNight]) },
  render: () => <RouterStory path="/admin/seasons/:seasonId/main-event" url="/admin/seasons/1/main-event" element={<MainEventAdmin />} />,
}

/** An open Main Event night: the answers, and no partial result. */
export const MainEventNight: StoryObj = {
  render: () => <RouterStory path="/nights/:nightId" url="/nights/14" element={<NightPage />} />,
}

/** A finished Main Event night, with the order of its players. */
export const MainEventNightFinished: StoryObj = {
  render: () => <RouterStory path="/nights/:nightId" url="/nights/13" element={<NightPage />} />,
}

/** "Finalizar" for a Main Event night: one picker for the 1st place, and one more after each player chosen. */
export const MainEventResultForm: StoryObj = {
  render: () => <RouterStory path="/nights/:nightId/main-event-result" url="/nights/14/main-event-result" element={<MainEventResultFormPage />} />,
}

/** Correcting the result of a finished Main Event. */
export const MainEventResultFormCorrecting: StoryObj = {
  render: () => <RouterStory path="/nights/:nightId/main-event-result" url="/nights/13/main-event-result" element={<MainEventResultFormPage />} />,
}

/** A screen inside the site's header and menus. The header names the season on screen and leads to "Temporadas". */
export const Layout: StoryObj = { render: () => <RouterStory path="/" url="/" element={<StandingsPage />} layout={<AppLayout />} /> }

/** The address names another season: a notice says so and offers the way back. */
export const LayoutWithAnotherSeason: StoryObj = {
  render: () => <RouterStory path="/seasons/:seasonId" url="/seasons/2" element={<StandingsPage />} layout={<AppLayout />} />,
}

/** An open night before anyone filled the partial result. */
export const OpenNight: StoryObj = { render: () => <RouterStory path="/nights/:nightId" url="/nights/11" element={<NightPage />} /> }

const withPartialResult = [http.get('/api/v1/nights/:id/partial-result', () => HttpResponse.json({ data: partialResult })), ...handlers]

/** An open night with what the players recorded so far. */
export const OpenNightWithPartialResult: StoryObj = {
  parameters: { msw: withPartialResult },
  render: () => <RouterStory path="/nights/:nightId" url="/nights/11" element={<NightPage />} />,
}

/** "Resultado parcial": an active player records what is known while the night runs. Nothing is required. */
export const PartialResultForm: StoryObj = {
  parameters: { msw: withPartialResult },
  render: () => <RouterStory path="/nights/:nightId/partial-result" url="/nights/11/partial-result" element={<PartialResultFormPage />} />,
}

/** A player who is not active, or an account with no player, sees why there is no form. */
export const PartialResultFormNotAllowed: StoryObj = {
  parameters: { msw: [http.get('/api/v1/me', () => HttpResponse.json({ data: { ...keeper, role: 'player', abilities: { ...keeper.abilities, run_nights: false, save_partial_results: false } } })), ...handlers] },
  render: () => <RouterStory path="/nights/:nightId/partial-result" url="/nights/11/partial-result" element={<PartialResultFormPage />} />,
}

/** "Finalizar" on a night with a partial result: the form starts filled and says where the values came from. */
export const ResultFormFromPartialResult: StoryObj = {
  parameters: { msw: withPartialResult },
  render: () => <RouterStory path="/nights/:nightId/result" url="/nights/11/result" element={<ResultFormPage />} />,
}

/** The key phone screen: entering a night's result at the table. Submitting shows a rule error from the mock. */
export const ResultForm: StoryObj = {
  render: () => <RouterStory path="/nights/:nightId/result" url="/nights/11/result" element={<ResultFormPage />} />,
}

export const CorrectingAResult: StoryObj = {
  render: () => <RouterStory path="/nights/:nightId/result" url="/nights/10/result" element={<ResultFormPage />} />,
}

export const Simulator: StoryObj = { render: () => <RouterStory path="/simulator" url="/simulator" element={<SimulatorPage />} /> }

export const Login: StoryObj = {
  parameters: { msw: [http.get('/api/v1/me', () => new HttpResponse(null, { status: 401 })), ...handlers] },
  render: () => <RouterStory path="/login" url="/login" element={<LoginPage />} />,
}

type Play = NonNullable<StoryObj['play']>

const forgotPassword = () => <RouterStory path="/forgot-password" url="/forgot-password" element={<ForgotPasswordPage />} />
const refusedLogin = (rule: string, message: string) =>
  http.post('/api/v1/password-resets', () => HttpResponse.json({ message, rule, errors: { login: [message] } }, { status: 422 }))
const askForLink: Play = async ({ canvas, userEvent }) => {
  await userEvent.type(canvas.getByLabelText(/Usuário ou e-mail/), 'maria')
  await userEvent.click(canvas.getByRole('button', { name: 'Enviar link' }))
}

/** "Esqueci minha senha", reached from the login screen: the username or the email. */
export const ForgotPassword: StoryObj = { render: forgotPassword }

/** No account has the username or email. */
export const ForgotPasswordUnknownAccount: StoryObj = {
  parameters: { msw: [refusedLogin('password_reset.unknown_account', 'Não encontramos nenhum acesso com este usuário ou e-mail.'), ...handlers] },
  render: forgotPassword,
  play: async (context) => {
    await askForLink(context)
    await context.canvas.findByText('Não encontramos nenhum acesso com este usuário ou e-mail.')
  },
}

/** The account's address is on the site's own domain or an invented one, so no link is sent. */
export const ForgotPasswordNoEmail: StoryObj = {
  parameters: {
    msw: [
      refusedLogin('password_reset.no_usable_email', 'Este acesso não tem um e-mail válido cadastrado. Peça a um administrador para definir uma nova senha.'),
      ...handlers,
    ],
  },
  render: forgotPassword,
  play: async (context) => {
    await askForLink(context)
    await context.canvas.findByText(/Peça a um administrador/)
  },
}

/** The link was sent. The address shows only its first letter and its domain. */
export const ForgotPasswordSent: StoryObj = {
  render: forgotPassword,
  play: async (context) => {
    await askForLink(context)
    await context.canvas.findByText('m•••@example.com')
  },
}

const resetPassword = () => <RouterStory path="/reset-password" url="/reset-password?token=abc" element={<ResetPasswordPage />} />
const refusedLink = (rule: string, message: string) =>
  http.get('/api/v1/password-resets/:token', () => HttpResponse.json({ message, rule, errors: {} }, { status: 422 }))
const typeNewPassword = (repeated: string): Play => async ({ canvas, userEvent }) => {
  await userEvent.type(await canvas.findByLabelText(/^Nova senha/), 'mesa-verde-7')
  await userEvent.type(canvas.getByLabelText(/Repetir a nova senha/), repeated)
  await userEvent.click(canvas.getByRole('button', { name: 'Salvar nova senha' }))
}

/** The screen behind the link in the email: a new password, typed twice. */
export const ResetPassword: StoryObj = { render: resetPassword }

/** The link was already used, or never existed. */
export const ResetPasswordInvalidLink: StoryObj = {
  parameters: { msw: [refusedLink('password_reset.invalid_link', 'Este link não é válido ou já foi usado. Peça um novo link.'), ...handlers] },
  render: resetPassword,
}

/** The link is more than 60 minutes old. */
export const ResetPasswordExpiredLink: StoryObj = {
  parameters: { msw: [refusedLink('password_reset.expired', 'Este link expirou. Peça um novo link.'), ...handlers] },
  render: resetPassword,
}

/** The two passwords differ: nothing is sent. */
export const ResetPasswordMismatch: StoryObj = {
  render: resetPassword,
  play: async (context) => {
    await typeNewPassword('mesa-verde-8')(context)
    await context.canvas.findByText('As duas senhas não são iguais.')
  },
}

/** The new password is saved. The user logs in with it. */
export const ResetPasswordDone: StoryObj = {
  render: resetPassword,
  play: async (context) => {
    await typeNewPassword('mesa-verde-7')(context)
    await context.canvas.findByText('Senha alterada. Entre com a nova senha.')
  },
}

/** "Remarcar": a results keeper moves a scheduled night to another date and time. */
export const Rescheduling: StoryObj = {
  parameters: { layout: 'padded' },
  render: () => (
    <RouterStory path="/" url="/" element={<RescheduleForm night={{ ...openNight, status: 'scheduled' }} onDone={() => {}} />} />
  ),
}

const scheduledNight = { ...openNight, status: 'scheduled' as const, results: [], description: 'Noite de pizza. Tragam a bebida.' }
const withScheduledNight = [http.get('/api/v1/nights/:id', () => HttpResponse.json({ data: scheduledNight })), ...handlers]
const asAdmin = http.get('/api/v1/me', () => HttpResponse.json({ data: { ...keeper, role: 'admin', abilities: { ...keeper.abilities, edit_played_nights: true } } }))
const nightEdit = (id: number) => <RouterStory path="/nights/:nightId/edit" url={`/nights/${id}/edit`} element={<NightEditPage />} />

/** A scheduled night with a description, as a results keeper sees it: "Abrir", "Remarcar", "Cancelar" and "Editar evento". */
export const ScheduledNightWithDescription: StoryObj = {
  parameters: { msw: withScheduledNight },
  render: () => <RouterStory path="/nights/:nightId" url="/nights/11" element={<NightPage />} />,
}

/** "Editar evento": a results keeper changes the place and description of a scheduled night. */
export const NightEdit: StoryObj = { parameters: { msw: withScheduledNight }, render: () => nightEdit(11) }

/** An admin edits a finished night: the same form. */
export const NightEditFinished: StoryObj = { parameters: { msw: [asAdmin, ...handlers] }, render: () => nightEdit(10) }

/** A results keeper on a finished night sees why there is no form. */
export const NightEditNotAllowed: StoryObj = { render: () => nightEdit(10) }

/** The API refuses the place: the message shows under the field. */
export const NightEditPlaceError: StoryObj = {
  parameters: {
    msw: [
      http.patch('/api/v1/nights/:id', () =>
        HttpResponse.json({ message: 'O local selecionado é inválido.', errors: { place_id: ['O local selecionado é inválido.'] } }, { status: 422 }),
      ),
      ...withScheduledNight,
    ],
  },
  render: () => nightEdit(11),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByRole('button', { name: 'Salvar' }))
    await canvas.findByText('O local selecionado é inválido.')
  },
}

/** The player list in "Administração". From 640px wide, each row also has the status buttons. */
export const PlayersAdminList: StoryObj = {
  render: () => <RouterStory path="/admin/players" url="/admin/players" element={<PlayersAdmin />} />,
}

/** A player's own page in "Administração": details, status, photos and site access. */
export const PlayerAdminPage: StoryObj = {
  render: () => <RouterStory path="/admin/players/:playerId" url="/admin/players/1" element={<PlayerEditPage />} />,
}

/** The season list in "Administração". */
export const SeasonsAdminList: StoryObj = {
  render: () => <RouterStory path="/admin" url="/admin" element={<SeasonsAdmin />} />,
}

/** A season's own page in "Administração": its details, regular night and percentage table. */
export const SeasonAdminPage: StoryObj = {
  render: () => <RouterStory path="/admin/seasons/:seasonId" url="/admin/seasons/1" element={<SeasonEditPage />} />,
}

/** A season's page on a site with no time chip and no house owner's buy-in: only the buy-in and the rebuys. */
export const SeasonAdminPageFewAmounts: StoryObj = {
  ...SeasonAdminPage,
  decorators: [withFeatures({ timeChip: false, houseOwnerBuyIn: false })],
}

/** The place list in "Administração". */
export const PlacesAdminList: StoryObj = {
  render: () => <RouterStory path="/admin/places" url="/admin/places" element={<PlacesAdmin />} />,
}

/** A place's own page in "Administração": its name and address. */
export const PlaceAdminPage: StoryObj = {
  render: () => <RouterStory path="/admin/places/:placeId" url="/admin/places/1" element={<PlaceEditPage />} />,
}

/** "Meu perfil": the logged-in player's own details, photos and password. The mocked user is Joana, who has no photos. */
export const Profile: StoryObj = {
  render: () => <RouterStory path="/profile" url="/profile" element={<ProfilePage />} />,
}

/** A profile with a photo, with "Trocar" and "Remover". */
export const ProfileWithPhotos: StoryObj = {
  parameters: { msw: [http.get('/api/v1/me', () => HttpResponse.json({ data: { ...keeper, player: { ...players[0], email: 'ana@example.com', birth_date: '1990-05-17' } } })), ...handlers] },
  render: () => <RouterStory path="/profile" url="/profile" element={<ProfilePage />} />,
}

/** An imported player with only the small photo: it stands in for the photo, and can be replaced or removed. */
export const ProfileWithOldThumbnail: StoryObj = {
  parameters: { msw: [http.get('/api/v1/me', () => HttpResponse.json({ data: { ...keeper, player: players[2] } })), ...handlers] },
  render: () => <RouterStory path="/profile" url="/profile" element={<ProfilePage />} />,
}

/** An account with no player, such as an admin who does not play, only changes its password. */
export const ProfileWithoutPlayer: StoryObj = {
  parameters: { msw: [http.get('/api/v1/me', () => HttpResponse.json({ data: { ...keeper, player: null } })), ...handlers] },
  render: () => <RouterStory path="/profile" url="/profile" element={<ProfilePage />} />,
}
