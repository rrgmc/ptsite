import { useState } from 'react'
import { FileTrigger } from 'react-aria-components'
import { ApiError, type Player } from '@/api/client'
import { useRemovePlayerPhoto, useSavePlayerPhoto } from '@/api/queries'
import { Button } from '@/components/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { playerImageUrl } from '@/lib/playerImages'
import { shrinkPicture } from '@/lib/resizeImage'

/**
 * A player's photo, with "Enviar" and "Remover". The server makes the small photo of the lists from it, so the two
 * change together. Used on the player's own profile and on the player's page in "Administração". A change takes
 * effect at once; it does not wait for the form's "Salvar".
 */
export function PlayerImagesEditor({ player }: { player: Player }) {
  const save = useSavePlayerPhoto()
  const remove = useRemovePlayerPhoto()
  const [unreadable, setUnreadable] = useState(false)
  const [confirming, setConfirming] = useState(false)
  // An imported player may have only the small photo: it stands in for the photo until a new one is sent.
  const url = playerImageUrl(player, 'photo') ?? playerImageUrl(player, 'thumbnail')

  const send = async (file: File | undefined) => {
    if (!file) return
    setUnreadable(false)
    remove.reset()
    try {
      save.mutate({ playerId: player.id, image: await shrinkPicture(file) })
    } catch {
      save.reset()
      setUnreadable(true)
    }
  }

  const failure = save.error ?? remove.error
  const message = unreadable
    ? 'Não foi possível ler este arquivo. Escolha uma imagem JPEG, PNG ou WebP.'
    : failure instanceof ApiError
      ? (failure.fieldError('image') ?? failure.message)
      : failure?.message

  return (
    <div className="flex flex-wrap items-center gap-3">
      {url ? (
        <img src={url} alt={`Foto de ${player.nickname}`} className="h-32 w-24 shrink-0 rounded-md bg-surface-sunken object-cover" />
      ) : (
        <span className="flex h-32 w-24 shrink-0 items-center justify-center rounded-md bg-surface-sunken text-center text-xs text-muted">Sem foto</span>
      )}
      <p className="min-w-0 flex-1 basis-40 text-sm text-muted">Aparece ao lado do apelido nas listas e abre ao tocar nela. O site usa o meio da imagem.</p>
      <div className="flex flex-wrap gap-2">
        <FileTrigger acceptedFileTypes={['image/jpeg', 'image/png', 'image/webp']} onSelect={(files) => void send(files?.[0])}>
          <Button variant="secondary" isPending={save.isPending} aria-label={url ? 'Trocar foto' : 'Enviar foto'}>{url ? 'Trocar' : 'Enviar'}</Button>
        </FileTrigger>
        {url && (
          <Button variant="ghost" isPending={remove.isPending} onPress={() => setConfirming(true)} aria-label="Remover foto">Remover</Button>
        )}
      </div>
      {message && <p role="alert" className="w-full rounded-md bg-danger-soft p-3 text-danger">{message}</p>}
      <ConfirmDialog
        isOpen={confirming}
        onOpenChange={setConfirming}
        title="Remover a foto?"
        confirmLabel="Remover"
        confirmVariant="danger"
        isPending={remove.isPending}
        onConfirm={() => {
          setUnreadable(false)
          save.reset()
          remove.mutate({ playerId: player.id }, { onSettled: () => setConfirming(false) })
        }}
      >
        A foto de {player.nickname} deixa de aparecer no site.
      </ConfirmDialog>
    </div>
  )
}
