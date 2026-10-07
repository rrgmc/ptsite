import type { Meta, StoryObj } from '@storybook/react-vite'
import { ApiError } from '@/api/client'
import { Badge, Empty, ErrorBox, Loading } from './Feedback'

const meta = { title: 'Components/Feedback' } satisfies Meta
export default meta

export const Badges: StoryObj = {
  render: () => (
    <div className="flex gap-2">
      <Badge>inativo</Badge>
      <Badge tone="primary">Aberto</Badge>
      <Badge tone="warning">Fechada</Badge>
      <Badge tone="danger">arquivado</Badge>
    </div>
  ),
}
export const LoadingState: StoryObj = { render: () => <Loading /> }
export const EmptyState: StoryObj = { render: () => <Empty>Ninguém pontuou ainda nesta temporada.</Empty> }
export const RuleError: StoryObj = {
  render: () => (
    <ErrorBox error={new ApiError(409, { message: 'Já existe um evento aberto nesta temporada. Finalize-o antes de abrir outro.' })} />
  ),
}
