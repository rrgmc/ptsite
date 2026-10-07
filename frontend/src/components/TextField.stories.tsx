import type { Meta, StoryObj } from '@storybook/react-vite'
import { TextField } from './TextField'

const meta = { component: TextField, args: { label: 'Pote (R$)', placeholder: '840,00', inputMode: 'decimal' } } satisfies Meta<typeof TextField>
export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}
export const Filled: Story = { args: { defaultValue: '845,00' } }
export const WithDescription: Story = { args: { description: 'Total apostado no evento.' } }
export const WithError: Story = { args: { defaultValue: 'abc', errorMessage: 'Valor inválido. Use por exemplo 840 ou 840,50.' } }
