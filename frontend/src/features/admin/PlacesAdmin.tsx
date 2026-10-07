import { useState } from 'react'
import { Form } from 'react-aria-components'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { ApiError, type Place } from '@/api/client'
import { usePlaces, useSavePlace } from '@/api/queries'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Badge, ErrorBox, Loading } from '@/components/Feedback'
import { TextField } from '@/components/TextField'
import { t } from '@/i18n'

export function PlacesAdmin() {
  const places = usePlaces({ archived: true })
  const save = useSavePlace()
  const navigate = useNavigate()
  const [archiving, setArchiving] = useState<Place | null>(null)
  const isSaving = (id: number) => save.isPending && save.variables?.id === id

  return (
    <div className="flex flex-col gap-4">
      <Button className="self-start" onPress={() => navigate('/admin/places/new')}>{t.admin.places.newPlace}</Button>
      {save.error && <ErrorBox error={save.error} />}
      {places.isPending ? <Loading /> : places.error ? <ErrorBox error={places.error} /> : (
        <Card>
          <ul className="divide-y divide-border/60">
            {places.data!.map((p) => (
              <li key={p.id} className="flex min-h-touch flex-wrap items-center justify-between gap-2 px-2 py-2 even:bg-surface-stripe">
                <span className="min-w-0 wrap-break-word">
                  <span className="flex flex-wrap items-center gap-x-2">
                    <span className={`font-semibold ${p.archived ? 'text-muted line-through' : ''}`}>{p.name}</span>
                    {p.archived && <Badge tone="danger">{t.common.archived}</Badge>}
                  </span>
                  <span className="block text-sm text-muted">{p.address ?? t.admin.places.noAddress}</span>
                </span>
                <span className="flex flex-wrap items-center">
                  {/* Archiving asks first. Restoring hides nothing, so it takes effect at once. */}
                  <Button
                    variant="ghost"
                    className="px-3"
                    isPending={isSaving(p.id)}
                    onPress={() => (p.archived ? save.mutate({ id: p.id, archived: false }) : setArchiving(p))}
                    aria-label={p.archived ? t.admin.restoreItem({ name: p.name }) : t.admin.archiveItem({ name: p.name })}
                  >
                    {p.archived ? t.common.restore : t.common.archive}
                  </Button>
                  <Button variant="ghost" className="px-3" onPress={() => navigate(`/admin/places/${p.id}`)} aria-label={t.admin.editItem({ name: p.name })}>{t.common.edit}</Button>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {archiving && (
        <ConfirmDialog
          isOpen
          onOpenChange={() => setArchiving(null)}
          title={t.admin.archiveConfirmTitle({ name: archiving.name })}
          confirmLabel={t.common.archive}
          confirmVariant="danger"
          isPending={save.isPending}
          onConfirm={() => save.mutate({ id: archiving.id, archived: true }, { onSettled: () => setArchiving(null) })}
        >
          {t.admin.places.archiveConfirmBody}
        </ConfirmDialog>
      )}
    </div>
  )
}

/** A place's own page in "Administração": /admin/places/new or /admin/places/:placeId. */
export function PlaceEditPage() {
  const { placeId } = useParams()
  const id = placeId === 'new' ? undefined : Number(placeId)
  // The API has no endpoint for one place, so the place comes from the list. Archived places can be edited too.
  const places = usePlaces({ archived: true })
  const place = places.data?.find((p) => p.id === id)
  const navigate = useNavigate()
  const location = useLocation()
  // Back to the list where it was left, or to the list itself when this page was opened directly.
  const back = () => (location.key !== 'default' ? navigate(-1) : navigate('/admin/places'))

  return (
    <div className="flex flex-col gap-3">
      <Link to="/admin/places" className="inline-flex min-h-touch items-center self-start font-semibold text-primary">{t.admin.places.back}</Link>
      {id === undefined ? (
        <PlaceForm place={null} onDone={back} />
      ) : places.isPending ? (
        <Loading />
      ) : places.error ? (
        <ErrorBox error={places.error} />
      ) : place ? (
        <PlaceForm key={place.id} place={place} onDone={back} />
      ) : (
        <ErrorBox error={new Error(t.admin.places.notFound)} />
      )}
    </div>
  )
}

function PlaceForm({ place, onDone }: { place: Place | null; onDone: () => void }) {
  const save = useSavePlace()
  const [name, setName] = useState(place?.name ?? '')
  const [address, setAddress] = useState(place?.address ?? '')
  const error = save.error instanceof ApiError ? save.error : null

  return (
    <Card title={place ? t.admin.editItem({ name: place.name }) : t.admin.places.newTitle}>
      <Form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          save.mutate({ id: place?.id, name, address: address || null }, { onSuccess: onDone })
        }}
      >
        <TextField label={t.common.name} value={name} onChange={setName} isRequired errorMessage={error?.fieldError('name')} />
        <TextField label={t.admin.places.address} value={address} onChange={setAddress} errorMessage={error?.fieldError('address')} />
        {error && !error.body.errors && <ErrorBox error={error} />}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" isPending={save.isPending}>{t.common.save}</Button>
          <Button variant="ghost" onPress={onDone}>{t.common.cancel}</Button>
        </div>
      </Form>
    </Card>
  )
}
