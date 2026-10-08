import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { NightDashboard } from '@/api/client'
import { overrideFeatures } from '@/lib/features'
import { finishedNightDashboard, nightDashboard, openNight, players, season } from '@/mocks/data'
import { applyChange } from './dashboardMoney'
import { NightDashboardView } from './NightDashboardView'

// The night dashboard as a screen (docs/specs/night-dashboard.md): each tap is one change.

const [ana, breno, , dudu, , fausto] = players

function view(dashboard: NightDashboard = nightDashboard, props: { error?: string; players?: typeof players } = {}) {
  const onChange = vi.fn()
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <NightDashboardView night={openNight} dashboard={dashboard} percentages={season.percentages ?? []} players={props.players ?? players} onChange={onChange} error={props.error} />
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

  it('marks a buy-in as paid in cash at one tap, as not in cash at another, and unmarks it at a third', async () => {
    const onChange = view()

    expect(marksOf('Dudu').getByRole('button', { name: 'Buy-in' })).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(marksOf('Dudu').getByRole('button', { name: 'Buy-in' }))
    expect(onChange).toHaveBeenLastCalledWith({ type: 'mark', player: dudu, buy_in_paid: true, buy_in_non_cash: false })

    expect(marksOf('Ana').getByRole('button', { name: 'Buy-in' })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(marksOf('Ana').getByRole('button', { name: 'Buy-in' }))
    expect(onChange).toHaveBeenLastCalledWith({ type: 'mark', player: ana, buy_in_paid: true, buy_in_non_cash: true })
    cleanup()

    const again = view(applyChange(nightDashboard, { type: 'mark', player: ana, buy_in_non_cash: true }))
    // Still a pressed button, with a sign and a name of its own.
    const notInCash = marksOf('Ana').getByRole('button', { name: 'Buy-in (fora do dinheiro)' })
    expect(notInCash).toHaveAttribute('aria-pressed', 'true')
    expect(notInCash).toHaveTextContent('⇄')
    await userEvent.click(notInCash)
    expect(again).toHaveBeenLastCalledWith({ type: 'mark', player: ana, buy_in_paid: false, buy_in_non_cash: false })
  })

  it('marks a rebuy the same way', async () => {
    const onChange = view()

    await userEvent.click(marksOf('Ana').getByRole('button', { name: 'Rebuy 1' }))
    expect(onChange).toHaveBeenLastCalledWith({ type: 'markRebuy', player: ana, index: 0, id: 1, paid: true, non_cash: true })
    cleanup()

    const again = view(applyChange(nightDashboard, { type: 'markRebuy', player: ana, index: 0, id: 1, paid: true, non_cash: true }))
    await userEvent.click(marksOf('Ana').getByRole('button', { name: 'Rebuy 1 (fora do dinheiro)' }))
    expect(again).toHaveBeenLastCalledWith({ type: 'markRebuy', player: ana, index: 0, id: 1, paid: false, non_cash: false })
  })

  it('says how much of what was paid is in cash, once a payment was not', () => {
    view()
    const totals = screen.getByRole('region', { name: 'Valores do evento' })
    expect(totals).not.toHaveTextContent('Em dinheiro')
    cleanup()

    view(applyChange(applyChange(nightDashboard, { type: 'markRebuy', player: ana, index: 0, id: 1, paid: true, non_cash: true }), { type: 'mark', player: breno, buy_in_non_cash: true }))
    const split = within(screen.getByRole('region', { name: 'Valores do evento' }))
    expect(split.getByText('Em dinheiro R$ 190,00')).toBeInTheDocument()
    expect(split.getByText('Fora do dinheiro R$ 105,00')).toBeInTheDocument()
    expect(split.getByText('Total').closest('div')).toHaveTextContent('TotalR$ 450,00Pago R$ 295,00Falta R$ 155,00')
  })

  it('opens the adjustment of what was not in cash when it is marked "Usar", and takes a negative amount', async () => {
    const onChange = view()

    const field = () => screen.getByRole('textbox', { name: 'Ajuste fora do dinheiro (R$)' })
    expect(field()).toBeDisabled()
    expect(field()).toHaveValue('0,00')
    await userEvent.click(screen.getByRole('checkbox', { name: 'Usar o ajuste fora do dinheiro' }))
    expect(onChange).not.toHaveBeenCalled()

    await userEvent.clear(field())
    await userEvent.type(field(), '5-')
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled()
    await userEvent.clear(field())
    await userEvent.type(field(), '-5')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(onChange.mock.calls).toEqual([[{ type: 'nonCashAdjustment', amount: '-5.00' }]])
    cleanup()

    // A saved one is in use: it shows, and unmarking takes it away at once.
    const again = view(applyChange(nightDashboard, { type: 'nonCashAdjustment', amount: '-5.00' }))
    expect(field()).toHaveValue('-5,00')
    expect(within(screen.getByRole('region', { name: 'Valores do evento' })).getByText('Fora do dinheiro -R$ 5,00')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('checkbox', { name: 'Usar o ajuste fora do dinheiro' }))
    expect(again).toHaveBeenLastCalledWith({ type: 'nonCashAdjustment', amount: null })
  })

  it('adds a rebuy with the number the player had, and marks one as paid', async () => {
    const onChange = view()

    await userEvent.click(marksOf('Breno').getByRole('button', { name: '+ Rebuy' }))
    expect(onChange).toHaveBeenLastCalledWith({ type: 'addRebuy', player: breno, count: 3 })

    expect(marksOf('Breno').getByRole('button', { name: 'Rebuy 3' })).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(marksOf('Breno').getByRole('button', { name: 'Rebuy 3' }))
    expect(onChange).toHaveBeenLastCalledWith({ type: 'markRebuy', player: breno, index: 2, id: 4, paid: true, non_cash: false })
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
    expect(screen.queryByRole('group', { name: /^Adicionar / })).not.toBeInTheDocument()

    await userEvent.type(screen.getByRole('searchbox', { name: 'Adicionar jogador' }), 'fáu')
    await userEvent.click(within(screen.getByRole('group', { name: 'Adicionar Fausto' })).getByRole('button', { name: 'ALL IN' }))
    expect(onChange).toHaveBeenLastCalledWith({ type: 'mark', player: fausto })
    // The search is empty again, ready for the next player.
    expect(screen.getByRole('searchbox', { name: 'Adicionar jogador' })).toHaveValue('')

    await userEvent.type(screen.getByRole('searchbox', { name: 'Adicionar jogador' }), 'Fausto da')
    await userEvent.click(within(screen.getByRole('group', { name: 'Adicionar Fausto' })).getByRole('button', { name: 'Buy-in pago' }))
    expect(onChange).toHaveBeenLastCalledWith({ type: 'mark', player: fausto, buy_in_paid: true })
  })

  it('leaves out of the search who is already on the night, and marks an inactive player', async () => {
    view()

    await userEvent.type(screen.getByRole('searchbox', { name: 'Adicionar jogador' }), 'ana')
    // Ana is on the night; Joana is not.
    expect(screen.queryByRole('group', { name: 'Adicionar Ana' })).not.toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Adicionar Joana' })).toBeInTheDocument()

    await userEvent.clear(screen.getByRole('searchbox', { name: 'Adicionar jogador' }))
    await userEvent.type(screen.getByRole('searchbox', { name: 'Adicionar jogador' }), 'kiko')
    expect(screen.getByRole('group', { name: 'Adicionar Kiko' }).closest('li')).toHaveTextContent(/inativo/i)

    await userEvent.clear(screen.getByRole('searchbox', { name: 'Adicionar jogador' }))
    await userEvent.type(screen.getByRole('searchbox', { name: 'Adicionar jogador' }), 'zzz')
    expect(screen.getByText('Nenhum jogador encontrado.')).toBeInTheDocument()
  })

  it('shows eight players of a long search, and says how many there are', async () => {
    const many = Array.from({ length: 30 }, (_, i) => ({ ...fausto, id: 100 + i, nickname: `Silva ${String(i + 1).padStart(2, '0')}` }))
    view(nightDashboard, { players: [...players, ...many] })

    await userEvent.type(screen.getByRole('searchbox', { name: 'Adicionar jogador' }), 'silva 0')
    expect(screen.getAllByRole('group', { name: /^Adicionar Silva/ })).toHaveLength(8)
    expect(screen.getByText('Mostrando 8 de 9. Digite mais para encontrar.')).toBeInTheDocument()
  })

  it('shows each amount in a closed field while it is not marked "Manual"', () => {
    view()

    expect(screen.getByRole('textbox', { name: 'Pote (R$)' })).toBeDisabled()
    expect(screen.getByRole('textbox', { name: 'Pote (R$)' })).toHaveValue('425,00')
    expect(screen.getByRole('textbox', { name: 'Time chip (R$)' })).toBeDisabled()
    expect(screen.getByRole('textbox', { name: 'Time chip (R$)' })).toHaveValue('25,00')
    // The Main Event pot is the season's share of the pot.
    expect(screen.getByRole('textbox', { name: 'Pote ME (R$)' })).toBeDisabled()
    expect(screen.getByRole('textbox', { name: 'Pote ME (R$)' })).toHaveValue('85,00')
    expect(screen.getAllByRole('checkbox').map((box) => box.getAttribute('aria-label'))).toEqual([
      'Definir o pote manualmente',
      'Definir o time chip manualmente',
      'Definir o pote ME manualmente',
      'Usar o ajuste fora do dinheiro',
    ])
    expect(screen.queryByRole('button', { name: 'Salvar' })).not.toBeInTheDocument()
  })

  it('opens the field of an amount marked "Manual", and saves what is typed for that amount alone', async () => {
    const onChange = view()

    await userEvent.click(screen.getByRole('checkbox', { name: 'Definir o pote manualmente' }))
    const pot = screen.getByRole('textbox', { name: 'Pote (R$)' })
    // The field starts from the amount worked out. Nothing is sent, and nothing is to be saved, yet.
    expect(pot).toBeEnabled()
    expect(pot).toHaveValue('425,00')
    expect(screen.getByRole('textbox', { name: 'Time chip (R$)' })).toBeDisabled()
    expect(onChange).not.toHaveBeenCalled()

    await userEvent.clear(pot)
    await userEvent.type(pot, '600')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(onChange).toHaveBeenLastCalledWith({ type: 'amounts', pot: '600.00' })
  })

  it('saves a time chip and a Main Event pot marked "Manual", each by itself', async () => {
    const onChange = view()

    await userEvent.click(screen.getByRole('checkbox', { name: 'Definir o time chip manualmente' }))
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(onChange).toHaveBeenLastCalledWith({ type: 'amounts', time_chip: '25.00' })
    cleanup()

    const again = view()
    await userEvent.click(screen.getByRole('checkbox', { name: 'Definir o pote ME manualmente' }))
    const mainEventPot = screen.getByRole('textbox', { name: 'Pote ME (R$)' })
    await userEvent.clear(mainEventPot)
    await userEvent.type(mainEventPot, '90')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(again).toHaveBeenLastCalledWith({ type: 'mainEventPot', amount: '90.00' })
  })

  it('saves every marked amount with the one "Salvar"', async () => {
    const onChange = view()

    await userEvent.click(screen.getByRole('checkbox', { name: 'Definir o pote manualmente' }))
    await userEvent.click(screen.getByRole('checkbox', { name: 'Definir o time chip manualmente' }))
    await userEvent.click(screen.getByRole('checkbox', { name: 'Definir o pote ME manualmente' }))
    expect(screen.getAllByRole('button', { name: 'Salvar' })).toHaveLength(1)
    await userEvent.clear(screen.getByRole('textbox', { name: 'Pote (R$)' }))
    await userEvent.type(screen.getByRole('textbox', { name: 'Pote (R$)' }), '600')
    await userEvent.clear(screen.getByRole('textbox', { name: 'Pote ME (R$)' }))
    await userEvent.type(screen.getByRole('textbox', { name: 'Pote ME (R$)' }), '100')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(onChange.mock.calls).toEqual([[{ type: 'amounts', pot: '600.00', time_chip: '25.00' }], [{ type: 'mainEventPot', amount: '100.00' }]])
  })

  it('refuses a wrong amount', async () => {
    const onChange = view()

    await userEvent.click(screen.getByRole('checkbox', { name: 'Definir o pote manualmente' }))
    await userEvent.clear(screen.getByRole('textbox', { name: 'Pote (R$)' }))
    await userEvent.type(screen.getByRole('textbox', { name: 'Pote (R$)' }), 'abc')
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('shows an amount set by hand in place of the one worked out, which stays in sight', async () => {
    const onChange = view({ ...nightDashboard, manual: { pot: '600.00', time_chip: null }, main_event_pot: '90.00' })
    const totals = within(screen.getByRole('region', { name: 'Valores do evento' }))

    expect(totals.getByText('Pote').closest('div')).toHaveTextContent('Pote(Manual)R$ 600,00Calculado R$ 425,00Pago R$ 275,00Falta R$ 150,00')
    expect(totals.getByText('Time chip').closest('div')).toHaveTextContent('Time chipR$ 25,00Pago R$ 20,00Falta R$ 5,00')
    expect(totals.getByText('Total').closest('div')).toHaveTextContent('Total(Manual)R$ 625,00Calculado R$ 450,00')

    expect(screen.getByRole('checkbox', { name: 'Definir o pote manualmente' })).toBeChecked()
    expect(screen.getByRole('textbox', { name: 'Pote (R$)' })).toHaveValue('600,00')
    expect(screen.getByRole('checkbox', { name: 'Definir o time chip manualmente' })).not.toBeChecked()
    expect(screen.getByRole('textbox', { name: 'Pote ME (R$)' })).toHaveValue('90,00')

    // Unmarking goes back to the amount worked out, at once.
    await userEvent.click(screen.getByRole('checkbox', { name: 'Definir o pote manualmente' }))
    expect(onChange).toHaveBeenLastCalledWith({ type: 'amounts', pot: null })
    await userEvent.click(screen.getByRole('checkbox', { name: 'Definir o pote ME manualmente' }))
    expect(onChange).toHaveBeenLastCalledWith({ type: 'mainEventPot', amount: null })
  })

  it('has an empty Main Event pot when the season sets no share of the pot', () => {
    view({ ...nightDashboard, suggested_main_event_pot: null })

    expect(screen.getByRole('textbox', { name: 'Pote ME (R$)' })).toHaveValue('')
  })

  it('has no time chip to set on a site without it', () => {
    view({ ...nightDashboard, totals: { ...nightDashboard.totals, time_chip: null } })

    expect(screen.getByRole('textbox', { name: 'Pote (R$)' })).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: 'Time chip (R$)' })).not.toBeInTheDocument()
  })

  it('folds the players away, and brings them back', async () => {
    view()

    await userEvent.click(screen.getByRole('button', { name: 'Jogadores (5)' }))
    expect(screen.queryByRole('group', { name: 'Pagamentos de Ana' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Jogadores (5)' }))
    expect(screen.getByRole('group', { name: 'Pagamentos de Ana' })).toBeInTheDocument()
  })

  it('creates no player: a search that finds nobody says so', async () => {
    view()

    await userEvent.type(screen.getByRole('searchbox', { name: 'Adicionar jogador' }), 'Estreante')
    expect(screen.getByText('Nenhum jogador encontrado.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Adicionar/ })).not.toBeInTheDocument()
  })

  it('has no Main Event pot on a site without it', () => {
    restore = overrideFeatures({ mainEventPot: false })
    view()

    expect(screen.queryByRole('checkbox', { name: 'Definir o pote ME manualmente' })).not.toBeInTheDocument()
  })

  it('shows the positions filled so far, and has no way to "Finalizar": a night is finished on its own page', () => {
    view()

    expect(screen.getByRole('button', { name: /^6º/ })).toHaveTextContent('Dudu')
    expect(screen.queryByRole('link', { name: /Finalizar/ })).not.toBeInTheDocument()
  })

  it('has the search for a player at the top of the players', async () => {
    view()

    const search = screen.getByRole('searchbox', { name: 'Adicionar jogador' })
    expect(search.compareDocumentPosition(screen.getByRole('group', { name: 'Pagamentos de Ana' })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    // Folded away with them.
    await userEvent.click(screen.getByRole('button', { name: 'Jogadores (5)' }))
    expect(screen.queryByRole('searchbox', { name: 'Adicionar jogador' })).not.toBeInTheDocument()
  })

  it('lets someone who cannot change it only look', () => {
    view({ ...nightDashboard, can_edit: false })

    expect(screen.getByRole('status')).toHaveTextContent('Você pode ver o painel, mas não alterar.')
    expect(marksOf('Ana').getByRole('button', { name: 'Buy-in' })).toBeDisabled()
    expect(screen.queryByRole('button', { name: '+ Rebuy' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Mais ações/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('searchbox', { name: 'Adicionar jogador' })).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
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
