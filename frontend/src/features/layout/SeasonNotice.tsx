import type { Season } from '@/api/client'
import { Button } from '@/components/Button'

/** Tells the user that the season on screen is not the current one, with the way back. */
export function SeasonNotice({ season, onBack }: { season: Season; onBack: () => void }) {
  return (
    <aside aria-label="Temporada selecionada" className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-md bg-warning-soft p-3 text-warning">
      <p className="min-w-0 wrap-anywhere">
        Você está vendo <strong>{season.name}</strong>, que não é a temporada atual.
      </p>
      <Button variant="secondary" onPress={onBack}>Voltar para a atual</Button>
    </aside>
  )
}
