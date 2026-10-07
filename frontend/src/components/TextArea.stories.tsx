import type { Meta, StoryObj } from '@storybook/react-vite'
import { TextArea } from './TextArea'

const meta = { component: TextArea, args: { label: 'Memo' } } satisfies Meta<typeof TextArea>
export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}
export const Filled: Story = { args: { defaultValue: 'Fundadora da mesa, joga desde 2009.\nNunca recusa um all-in antes do intervalo.' } }
export const WithDescription: Story = { args: { description: 'Um texto livre sobre o jogador. Todos veem na página do jogador.' } }
export const WithError: Story = { args: { defaultValue: 'a'.repeat(120), errorMessage: 'O campo memo não pode ter mais de 2000 caracteres.' } }
