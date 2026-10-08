import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { NightDashboard } from '@/api/client'
import { overrideFeatures } from '@/lib/features'
import { finishedNightDashboard, keeper, nightDashboard, openNight, players, season } from '@/mocks/data'
import { NightDashboardView } from './NightDashboardView'

// The night dashboard as a screen (docs/specs/night-dashboard.md): each tap is one change.

const [ana, breno, , dudu, , fausto] = players

function view(dashboard: NightDashboard = nightDashboard, props: { canFinish?: boolean; error?: string; players?: typeof players } = {}) {
  const onChange = vi.fn()
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <NightDashboardView night={openNight} dashboard={dashboard} percentages={season.percentages ?? []} players={props.players ?? players} onChange={onChange} canFinish={props.canFinish} error={props.error} />
      </MemoryRouter>
    </QueryClientProvider>,
  )
  return onChange
}

const marksOf = (nickname: string) => within(screen.getByRole('group', { name: `Pagamentos de ${nickname}` }))

let restore = () => {}
afterEach(() => {
  cleanup()
  restore()
  restore = () => {}
})

describe('NightDashboardView', () => {
  it('names the night, its house owner and the way back to the site', () => {
    view()

    expect(screen.getByRole('heading', { level: 1, name: 'Painel do evento' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Voltar ao site/ })).toHaveAttribute('href', '/nights/11')
    expect(screen.getByText(/Dono da casa:/)).toHaveTextContent('Dono da casa: Estela')
    expect(screen.getByRole('heading', { name: 'Jogadores (5)' })).toBeInTheDocument()
  })

  it('shows the pot, the time chip apart from it, and the total', () => {
    view()
    const totals = within(screen.getByRole('region', { name: 'Valores do evento' }))

    expect(totals.getByText('Pote').closest('div')).toHaveTextContent('PoteR$ 425,00Pago R$ 275,00Falta R$ 150,00')
    expect(totals.getByText('Time chip').closest('div')).toHaveTextContent('Time chipR$ 25,00Pago R$ 20,00Falta R$ 5,00')
    expect(totals.getByText('Total').closest('div')).toHaveTextContent('TotalR$ 450,00Pago R$ 295,00Falta R$ 155,00')
  })

  it('marks a buy-in as paid at one tap, and unmarks it at another', async () => {
    const onChange = view()

    expect(marksOf('Dudu').getByRole('button', { name: 'Buy-in' })).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(marksOf('Dudu').getByRole('button', { name: 'Buy-in' }))
    expect(onChange).toHaveBeenLastCalledWith({ type: 'mark', player: dudu, buy_in_paid: true })

    expect(marksOf('Ana').getByRole('button', { name: 'Buy-in' })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(marksOf('Ana').getByRole('button', { name: 'Buy-in' }))
    expect(onChange).toHaveBeenLastCalledWith({ type: 'mark', player: ana, buy_in_paid: false })
  })

  it('adds a rebuy with the number the player had, and marks one as paid', async () => {
    const onChange = view()

    await userEvent.click(marksOf('Breno').getByRole('button', { name: '+ Rebuy' }))
    expect(onChange).toHaveBeenLastCalledWith({ type: 'addRebuy', player: breno, count: 3 })

    expect(marksOf('Breno').getByRole('button', { name: 'Rebuy 3' })).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(marksOf('Breno').getByRole('button', { name: 'Rebuy 3' }))
    expect(onChange).toHaveBeenLastCalledWith({ type: 'markRebuy', player: breno, index: 2, id: 4, paid: true })
  })

  it('offers no rebuy past the limit in a season that allows none there', () => {
    view({ ...nightDashboard, prices: { ...nightDashboard.prices, allows_extra_rebuys: false } })

    expect(marksOf('Breno').queryByRole('button', { name: '+ Rebuy' })).not.toBeInTheDocument()
    expect(marksOf('Ana').getByRole('button', { name: '+ Rebuy' })).toBeInTheDocument()
  })

  it('offers the paid mark of a time chip only once it is owed', async () => {
    const onChange = view()

    expect(marksOf('Dudu').queryByRole('button', { name: 'TC pago' })).not.toBeInTheDocument()
    await userEvent.click(marksOf('Dudu').getByRole('button', { name: 'Time chip' }))
    expect(onChange).toHaveBeenLastCalledWith({ type: 'mark', player: dudu, time_chip: true })
    expect(marksOf('Carlão').getByRole('button', { name: 'TC pago' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('has no time chip on a site without it', () => {
    view({ ...nightDashboard, totals: { ...nightDashboard.totals, time_chip: null } })

    expect(screen.queryByRole('button', { name: 'Time chip' })).not.toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Valores do evento' })).queryByText('Time chip')).not.toBeInTheDocument()
  })

  it('changes the house owner and removes a rebuy from the menu of a player', async () => {
    const onChange = view()

    await userEvent.click(screen.getByRole('button', { name: 'Mais ações de Breno' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'É o dono da casa' }))
    expect(onChange).toHaveBeenLastCalledWith({ type: 'houseOwner', player: breno })

    await userEvent.click(screen.getByRole('button', { name: 'Mais ações de Breno' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Remover o último rebuy' }))
    expect(onChange).toHaveBeenLastCalledWith({ type: 'removeRebuy', player: breno, index: 2, id: 4 })

    await userEvent.click(screen.getByRole('button', { name: 'Mais ações de Estela' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Não é o dono da casa' }))
    expect(onChange).toHaveBeenLastCalledWith({ type: 'houseOwner', player: null })
  })

  it('removes from the night only a player with no payments', async () => {
    const onChange = view()

    await userEvent.click(screen.getByRole('button', { name: 'Mais ações de Estela' }))
    expect(screen.getByRole('menuitem', { name: 'Remover do evento' })).toHaveAttribute('aria-disabled', 'true')
    await userEvent.keyboard('{Escape}')

    await userEvent.click(screen.getByRole('button', { name: 'Mais ações de Dudu' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Remover do evento' }))
    expect(onChange).toHaveBeenLastCalledWith({ type: 'removePlayer', player: dudu })
  })

  it('finds a player who is not on the night by a search, and confirms them at one tap, with the buy-in paid or not', async () => {
    const onChange = view()

    // Nobody is listed until someone searches: a league may have more than a hundred players.
    expect(screen.getByText('Digite o apelido de quem chegou para confirmar com um toque.')).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: /^Confirmar / })).not.toBeInTheDocument()

    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar jogador' }), 'fáu')
    await userEvent.click(within(screen.getByRole('group', { name: 'Confirmar Fausto' })).getByRole('button', { name: 'Confirmar' }))
    expect(onChange).toHaveBeenLastCalledWith({ type: 'mark', player: fausto })
    // The search is empty again, ready for the next player.
    expect(screen.getByRole('searchbox', { name: 'Buscar jogador' })).toHaveValue('')

    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar jogador' }), 'Fausto da')
    await userEvent.click(within(screen.getByRole('group', { name: 'Confirmar Fausto' })).getByRole('button', { name: 'Buy-in pago' }))
    expect(onChange).toHaveBeenLastCalledWith({ type: 'mark', player: fausto, buy_in_paid: true })
  })

  it('leaves out of the search who is already on the night, and marks an inactive player', async () => {
    view()

    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar jogador' }), 'ana')
    // Ana is on the night; Joana is not.
    expect(screen.queryByRole('group', { name: 'Confirmar Ana' })).not.toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Confirmar Joana' })).toBeInTheDocument()

    await userEvent.clear(screen.getByRole('searchbox', { name: 'Buscar jogador' }))
    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar jogador' }), 'kiko')
    expect(screen.getByRole('group', { name: 'Confirmar Kiko' }).closest('li')).toHaveTextContent(/inativo/i)

    await userEvent.clear(screen.getByRole('searchbox', { name: 'Buscar jogador' }))
    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar jogador' }), 'zzz')
    expect(screen.getByText('Nenhum jogador encontrado.')).toBeInTheDocument()
  })

  it('shows eight players of a long search, and says how many there are', async () => {
    const many = Array.from({ length: 30 }, (_, i) => ({ ...fausto, id: 100 + i, nickname: `Silva ${String(i + 1).padStart(2, '0')}` }))
    view(nightDashboard, { players: [...players, ...many] })

    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar jogador' }), 'silva 0')
    expect(screen.getAllByRole('group', { name: /^Confirmar Silva/ })).toHaveLength(8)
    expect(screen.getByText('Mostrando 8 de 9. Digite mais para encontrar.')).toBeInTheDocument()
  })

  it('uses the season\'s share of the pot as the Main Event pot, unless it is set by hand', async () => {
    const onChange = view()

    expect(screen.getByText('Pote ME: R$ 85,00, a parte do pote definida na temporada.')).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: /Pote ME/ })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('checkbox', { name: 'Definir o pote ME manualmente' }))
    await userEvent.type(screen.getByRole('textbox', { name: /Pote ME/ }), '90')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar pote ME' }))
    expect(onChange).toHaveBeenLastCalledWith({ type: 'mainEventPot', amount: '90.00' })
  })

  it('goes back to the season\'s share when the Main Event pot is no longer set by hand', async () => {
    const onChange = view({ ...nightDashboard, main_event_pot: '90.00' })

    expect(screen.getByRole('checkbox', { name: 'Definir o pote ME manualmente' })).toBeChecked()
    expect(screen.getByRole('textbox', { name: /Pote ME/ })).toHaveValue('90,00')
    await userEvent.click(screen.getByRole('checkbox', { name: 'Definir o pote ME manualmente' }))
    expect(onChange).toHaveBeenLastCalledWith({ type: 'mainEventPot', amount: null })
  })

  it('says that a season with no share of the pot suggests no Main Event pot', () => {
    view({ ...nightDashboard, suggested_main_event_pot: null })

    expect(screen.getByText(/^Pote ME: a temporada não define uma parte do pote\./)).toBeInTheDocument()
  })

  it('takes a pot and a time chip typed by hand, each beside the one worked out', async () => {
    const onChange = view()

    expect(screen.queryByRole('textbox', { name: 'Pote (R$)' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('checkbox', { name: 'Definir o pote e o time chip manualmente' }))
    // Nothing is sent until an amount is saved.
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByText('Calculado: R$ 425,00')).toBeInTheDocument()
    expect(screen.getByText('Calculado: R$ 25,00')).toBeInTheDocument()

    await userEvent.type(screen.getByRole('textbox', { name: 'Pote (R$)' }), '600')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar valores' }))
    // The time chip was left empty: it stays the one worked out.
    expect(onChange).toHaveBeenLastCalledWith({ type: 'amounts', pot: '600.00', time_chip: null })
  })

  it('shows an amount typed by hand in place of the one worked out, which stays in sight', async () => {
    const onChange = view({ ...nightDashboard, manual: { pot: '600.00', time_chip: null } })
    const totals = within(screen.getByRole('region', { name: 'Valores do evento' }))

    expect(totals.getByText('Pote').closest('div')).toHaveTextContent('Pote(manual)R$ 600,00Calculado R$ 425,00Pago R$ 275,00Falta R$ 150,00')
    expect(totals.getByText('Time chip').closest('div')).toHaveTextContent('Time chipR$ 25,00Pago R$ 20,00Falta R$ 5,00')
    expect(totals.getByText('Total').closest('div')).toHaveTextContent('Total(manual)R$ 625,00Calculado R$ 450,00')

    // Unticking goes back to the amounts worked out, at once.
    expect(screen.getByRole('textbox', { name: 'Pote (R$)' })).toHaveValue('600,00')
    await userEvent.click(screen.getByRole('checkbox', { name: 'Definir o pote e o time chip manualmente' }))
    expect(onChange).toHaveBeenLastCalledWith({ type: 'amounts', pot: null, time_chip: null })
  })

  it('asks for the pot alone on a site without the time chip', async () => {
    view({ ...nightDashboard, totals: { ...nightDashboard.totals, time_chip: null } })

    await userEvent.click(screen.getByRole('checkbox', { name: 'Definir o pote manualmente' }))
    expect(screen.getByRole('textbox', { name: 'Pote (R$)' })).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: 'Time chip (R$)' })).not.toBeInTheDocument()
  })

  it('has no Main Event pot on a site without it', () => {
    restore = overrideFeatures({ mainEventPot: false })
    view()

    expect(screen.queryByRole('checkbox', { name: 'Definir o pote ME manualmente' })).not.toBeInTheDocument()
  })

  it('shows the positions filled so far, and the way to "Finalizar" to who finishes nights', () => {
    view(nightDashboard, { canFinish: keeper.abilities.run_nights })

    expect(screen.getByRole('button', { name: /^6º/ })).toHaveTextContent('Dudu')
    expect(screen.getByRole('link', { name: 'Finalizar evento' })).toHaveAttribute('href', '/nights/11/result')
  })

  it('lets someone who cannot change it only look', () => {
    view({ ...nightDashboard, can_edit: false })

    expect(screen.getByRole('status')).toHaveTextContent('Você pode ver o painel, mas não alterar.')
    expect(marksOf('Ana').getByRole('button', { name: 'Buy-in' })).toBeDisabled()
    expect(screen.queryByRole('button', { name: '+ Rebuy' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Mais ações/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('searchbox', { name: 'Buscar jogador' })).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Finalizar evento' })).not.toBeInTheDocument()
  })

  it('shows what a finished night was finished with, and no positions', () => {
    view(finishedNightDashboard)

    expect(screen.getByRole('status')).toHaveTextContent('O evento foi finalizado. Só um administrador altera o painel.')
    expect(screen.getByRole('heading', { name: 'Resultado registrado' }).closest('section')).toHaveTextContent('Pote TotalR$ 430,00')
    expect(screen.queryByRole('heading', { name: 'Posições' })).not.toBeInTheDocument()
  })

  it('says why a change was refused', () => {
    view(nightDashboard, { error: 'O limite é de 2 rebuys por jogador.' })

    expect(screen.getByRole('alert')).toHaveTextContent('O limite é de 2 rebuys por jogador.')
  })
})
