import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button'

const meta = { component: Button, args: { children: 'Finalizar evento' } } satisfies Meta<typeof Button>
export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {}
export const Secondary: Story = { args: { variant: 'secondary', children: 'Cancelar' } }
export const Ghost: Story = { args: { variant: 'ghost', children: 'Editar' } }
export const Danger: Story = { args: { variant: 'danger', children: 'Arquivar' } }
export const Disabled: Story = { args: { isDisabled: true } }
export const Pending: Story = { args: { isPending: true } }
export const FullWidthOnPhone: Story = { args: { fullWidth: true } }
