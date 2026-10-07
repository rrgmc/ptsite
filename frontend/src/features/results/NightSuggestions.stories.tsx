import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import type { SuggestedNight } from '@/api/client'
import { NightSuggestions } from './NightSuggestions'

const fridays: SuggestedNight[] = [
  { starts_at: '2025-03-28T21:30:00-03:00' },
  { starts_at: '2025-04-04T21:30:00-03:00' },
  { starts_at: '2025-04-11T21:30:00-03:00' },
]

function Suggestions({ suggestions, today }: { suggestions: SuggestedNight[]; today: Date }) {
  const [value, setValue] = useState<string | null>(suggestions[0]?.starts_at ?? null)
  return <NightSuggestions suggestions={suggestions} value={value} onChange={(s) => setValue(s.starts_at)} today={today} />
}

const meta = { component: Suggestions } satisfies Meta<typeof Suggestions>
export default meta
type Story = StoryObj<typeof meta>

/** Created on Monday: this week's Friday first, and chosen. */
export const CreatedOnMonday: Story = { args: { suggestions: fridays, today: new Date(2025, 2, 24) } }
/** This week's night already exists: it starts next week. */
export const ThisWeekTaken: Story = { args: { suggestions: [...fridays.slice(1), { starts_at: '2025-04-18T21:30:00-03:00' }], today: new Date(2025, 2, 24) } }
