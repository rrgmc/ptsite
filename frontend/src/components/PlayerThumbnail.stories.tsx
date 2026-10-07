import type { Meta, StoryObj } from '@storybook/react-vite'
import { players } from '@/mocks/data'
import { PlayerPhotoButton, PlayerThumbnail } from './PlayerThumbnail'

const meta = { title: 'Components/PlayerThumbnail' } satisfies Meta
export default meta

const row = 'flex items-center gap-3'

export const WithThumbnail: StoryObj = {
  render: () => <span className={row}><PlayerThumbnail player={players[0]} /> {players[0].nickname}</span>,
}

/** Most players have no image: the first letter of the nickname keeps the rows lined up. */
export const WithoutImage: StoryObj = {
  render: () => <span className={row}><PlayerThumbnail player={players[5]} /> {players[5].nickname}</span>,
}

/** A player with only the larger photo shows it at thumbnail size. */
export const PhotoOnly: StoryObj = {
  render: () => <span className={row}><PlayerThumbnail player={{ ...players[1], thumbnail_version: null }} /> {players[1].nickname}</span>,
}

/** The small size is smaller on a phone only; from the `sm` width up it is the usual size. */
export const Small: StoryObj = {
  render: () => (
    <span className="flex flex-col gap-2">
      <span className={row}><PlayerThumbnail player={players[0]} size="sm" /> {players[0].nickname}</span>
      <span className={row}><PlayerThumbnail player={players[5]} size="sm" /> {players[5].nickname}</span>
    </span>
  ),
}

/** The large size stands in for the photo on the player's page and in the detailed players view. */
export const Large: StoryObj = {
  render: () => <span className="flex items-start gap-4"><PlayerThumbnail player={players[5]} size="lg" /> {players[5].nickname}</span>,
}

/** In the players list, the thumbnail of a player with a photo is a button that opens the photo. */
export const OpensPhoto: StoryObj = {
  render: () => <span className={row}><PlayerPhotoButton player={players[0]} /> {players[0].nickname}</span>,
}
