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

function view(dashboard: NightDashboard = nightDashboard, props: { canFinish?: boolean; error?: string } = {}) {
  const onChange = vi.fn()
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <NightDashboardView night={openNight} dashboard={dashboard} percentages={season.percentages ?? []} players={players} onChange={onChange} {...props} />
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

  it('confirms a player who is not on the night at one tap, with the buy-in paid or not', async () => {
    const onChange = view()

    // The active players who are not on the night: 10 active, 5 of them on it.
    await userEvent.click(screen.getByRole('button', { name: 'Não confirmados (5)' }))
    const fausto_ = within(screen.getByRole('group', { name: 'Confirmar Fausto' }))
    await userEvent.click(fausto_.getByRole('button', { name: 'Confirmar' }))
    expect(onChange).toHaveBeenLastCalledWith({ type: 'mark', player: fausto })
    await userEvent.click(fausto_.getByRole('button', { name: 'Buy-in pago' }))
    expect(onChange).toHaveBeenLastCalledWith({ type: 'mark', player: fausto, buy_in_paid: true })
  })

  it('takes the suggested Main Event pot at one tap, or a typed one', async () => {
    const onChange = view()

    expect(screen.getByText('Sugerido pela temporada: R$ 85,00')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /^Usar R\$\s85,00$/ }))
    expect(onChange).toHaveBeenLastCalledWith({ type: 'mainEventPot', amount: '85.00' })

    await userEvent.type(screen.getByRole('textbox', { name: /Pote ME/ }), '90')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(onChange).toHaveBeenLastCalledWith({ type: 'mainEventPot', amount: '90.00' })
  })

  it('has no Main Event pot on a site without it', () => {
    restore = overrideFeatures({ mainEventPot: false })
    view()

    expect(screen.queryByRole('textbox', { name: /Pote ME/ })).not.toBeInTheDocument()
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
    expect(screen.queryByRole('button', { name: /Não confirmados/ })).not.toBeInTheDocument()
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
