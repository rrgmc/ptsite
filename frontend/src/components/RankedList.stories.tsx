import type { Meta, StoryObj } from '@storybook/react-vite'
import { RankedList } from './RankedList'

// A short ranked table, used by the statistics lists.
const meta = {
  title: 'Components/RankedList',
  component: RankedList,
  parameters: { layout: 'padded' },
  args: { caption: 'Jogadores por vitórias', labelHeader: 'Jogador', valueHeader: 'Vitórias' },
} satisfies Meta<typeof RankedList>
export default meta

type Story = StoryObj<typeof meta>

/** Equal values share a position, and the next one skips: 1, 2, 2, 4. */
export const WithTies: Story = {
  args: {
    rows: [
      { key: 1, rank: 1, label: 'Ana', value: 7 },
      { key: 2, rank: 2, label: 'Breno', value: 5 },
      { key: 3, rank: 2, label: 'Carlão', value: 5 },
      { key: 4, rank: 4, label: 'Dudu', value: 1 },
    ],
  },
}

/** The last line is tied with lines that did not fit. */
export const CutTie: Story = {
  args: { rows: [{ key: 1, rank: 1, label: 'Ana', value: 2 }, { key: 2, rank: 2, label: 'Breno', value: 1 }], tiedNotShown: 3 },
}

export const LongName: Story = {
  args: { rows: [{ key: 1, rank: 1, label: <span className="wrap-anywhere">Casa do Carlão, salão de festas do condomínio</span>, value: 120 }] },
}
