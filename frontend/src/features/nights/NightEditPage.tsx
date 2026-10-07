import { useState } from 'react'
import { Form } from 'react-aria-components'
import { Link, useNavigate, useParams } from 'react-router'
import { ApiError, type Night } from '@/api/client'
import { useMe, useNight, usePlaces, useUpdateNight } from '@/api/queries'
import { Button } from '@/components/Button'
import { Card, PageHeader } from '@/components/Card'
import { ErrorBox, Loading } from '@/components/Feedback'
import { Select } from '@/components/Select'
import { TextArea } from '@/components/TextArea'
import { nightTitle } from '@/lib/format'
import { plainText } from '@/lib/plainText'
import { canEditNight } from './canEditNight'

const backLink = 'inline-flex min-h-touch items-center justify-center rounded-md px-4 font-semibold text-primary'
// The option that removes the place. No place has this id.
const noPlace = 0

/**
 * "Editar evento": a night's place and description, whatever its status. The date is changed in "Remarcar" and the
 * result in "Editar resultado".
 */
export function NightEditPage() {
  const nightId = Number(useParams().nightId)
  const night = useNight(nightId)
  const places = usePlaces()
  const me = useMe()

  if (night.isPending || places.isPending || me.isPending) return <Loading />
  if (night.error || places.error) return <ErrorBox error={night.error ?? places.error} />
  const n = night.data!

  const header = <PageHeader title="Editar evento" subtitle={nightTitle(n.starts_at)} />
  if (!canEditNight(n, me.data)) {
    return (
      <>
        {header}
        <Card className="max-w-xl">
          <p className="text-muted">
            {n.archived
              ? 'Este evento foi cancelado.'
              : n.status === 'scheduled'
                ? 'Só responsáveis e administradores editam um evento.'
                : 'Só administradores editam um evento aberto ou finalizado.'}
          </p>
          <Link to={`/nights/${nightId}`} className={`${backLink} mt-2 px-0`}>Voltar ao evento</Link>
        </Card>
      </>
    )
  }

  // An archived place is not in the list. The night keeps it unless another is picked.
  const options = [
    { id: noPlace, label: 'Local a definir' },
    ...(n.place && !places.data!.some((p) => p.id === n.place!.id) ? [{ id: n.place.id, label: n.place.name }] : []),
    ...places.data!.map((p) => ({ id: p.id, label: p.name })),
  ]

  return (
    <>
      {header}
      <NightEditForm night={n} options={options} />
    </>
  )
}

function NightEditForm({ night: n, options }: { night: Night; options: { id: number; label: string }[] }) {
  const update = useUpdateNight(n.id)
  const navigate = useNavigate()
  const initialPlaceId = n.place?.id ?? noPlace
  const [initialDescription] = useState(() => plainText(n.description))
  const [placeId, setPlaceId] = useState(initialPlaceId)
  const [description, setDescription] = useState(initialDescription)
  const error = update.error instanceof ApiError ? update.error : null

  return (
    <Form
      className="flex max-w-xl flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        // Only what was changed is sent, so an imported description keeps its markup until someone rewrites it.
        update.mutate(
          {
            ...(placeId !== initialPlaceId && { place_id: placeId === noPlace ? null : placeId }),
            ...(description.trim() !== initialDescription && { description: description.trim() || null }),
          },
          { onSuccess: () => navigate(`/nights/${n.id}`) },
        )
      }}
    >
      <Card>
        <div className="flex flex-col gap-3">
          <Select
            label="Local"
            options={options}
            selectedKey={placeId}
            onSelectionChange={(k) => setPlaceId(k === null ? noPlace : Number(k))}
            errorMessage={error?.fieldError('place_id')}
          />
          <TextArea
            label="Descrição"
            description="Aparece na página do evento."
            value={description}
            onChange={setDescription}
            maxLength={2000}
            errorMessage={error?.fieldError('description')}
          />
        </div>
      </Card>

      {error && !Object.keys(error.body.errors ?? {}).length && <ErrorBox error={error} />}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" isPending={update.isPending} fullWidth>Salvar</Button>
        <Link to={`/nights/${n.id}`} className={backLink}>Voltar ao evento</Link>
      </div>
    </Form>
  )
}
