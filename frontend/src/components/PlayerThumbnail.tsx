import { Button as AriaButton, Dialog, DialogTrigger, Heading, Modal, ModalOverlay } from 'react-aria-components'
import type { Player } from '@/api/client'
import { t } from '@/i18n'
import { playerImageUrl } from '@/lib/playerImages'
import { Button } from './Button'

type PlayerImages = Pick<Player, 'id' | 'nickname' | 'thumbnail_version' | 'photo_version'>

const frames = {
  md: 'h-12 w-9 shrink-0 rounded-sm',
  sm: 'h-8 w-6 shrink-0 rounded-sm text-sm sm:h-12 sm:w-9 sm:text-base',
  lg: 'h-32 w-24 shrink-0 rounded-md text-3xl',
}

/**
 * A player's small photo, shown next to the nickname. A player with only the larger photo shows that one, and a
 * player with no image shows the first letter of the nickname, so that rows line up.
 * The nickname is always next to it, so screen readers skip it.
 * The `sm` size is smaller on a phone only, for lists where the rows must be short.
 * The `lg` size is the size of the photo on the player's page and in the detailed players view.
 */
export function PlayerThumbnail({ player, size = 'md' }: { player: PlayerImages; size?: keyof typeof frames }) {
  const url = playerImageUrl(player, 'thumbnail') ?? playerImageUrl(player, 'photo')
  const frame = frames[size]
  return url ? (
    <img src={url} alt="" loading="lazy" className={`${frame} bg-surface-sunken object-cover`} />
  ) : (
    <span aria-hidden="true" className={`${frame} flex items-center justify-center bg-surface-sunken font-display font-bold uppercase text-muted`}>
      {player.nickname.trim().charAt(0)}
    </span>
  )
}

/** The thumbnail as a button that opens the player's larger photo. Without a photo it is the plain thumbnail. */
export function PlayerPhotoButton({ player }: { player: PlayerImages }) {
  const photo = playerImageUrl(player, 'photo')
  if (!photo) return <PlayerThumbnail player={player} />

  return (
    <DialogTrigger>
      <AriaButton
        aria-label={t.components.playerPhoto.view({ nickname: player.nickname })}
        className="shrink-0 rounded-sm hover:opacity-90 focus-visible:outline-3 focus-visible:outline-focus focus-visible:outline-offset-2"
      >
        <PlayerThumbnail player={player} />
      </AriaButton>
      <ModalOverlay isDismissable className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <Modal className="rounded-lg bg-surface p-5 shadow-raised">
          <Dialog className="flex flex-col items-center gap-3 outline-none">
            {({ close }) => (
              <>
                <Heading slot="title" className="text-lg font-bold">{player.nickname}</Heading>
                <img src={photo} alt={t.components.playerPhoto.alt({ nickname: player.nickname })} className="w-52 max-w-full rounded-md bg-surface-sunken" />
                <Button variant="secondary" onPress={close}>{t.common.close}</Button>
              </>
            )}
          </Dialog>
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  )
}
