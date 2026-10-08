import type { Meta, StoryObj } from '@storybook/react-vite'
import { ToggleChip } from './ToggleChip'

const meta = { component: ToggleChip, args: { children: 'Buy-in' } } satisfies Meta<typeof ToggleChip>
export default meta
type Story = StoryObj<typeof meta>

export const Off: Story = {}
/** On: a check mark, so the color is not the only sign. */
export const On: Story = { args: { defaultSelected: true } }
/** Something still to settle, such as a time chip that is owed. */
export const Owed: Story = { args: { tone: 'owed', defaultSelected: true, children: 'Time chip' } }
/** As someone who cannot change it sees it. */
export const DisabledOn: Story = { args: { isSelected: true, isDisabled: true } }
export const DisabledOff: Story = { args: { isDisabled: true } }
