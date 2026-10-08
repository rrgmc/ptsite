import type { ReactNode } from 'react'
import { Tab, TabList, TabPanel, Tabs } from 'react-aria-components'

export interface TabBoxTab {
  id: string
  title: string
  content: ReactNode
}

/**
 * A box with tabs: one of its parts shows at a time, picked by its title. The first one shows at first.
 * It may be narrower than its content (min-w-0), as a Card, and its titles scroll sideways when they do not fit.
 */
export function TabBox({ label, tabs }: {
  /** For screen readers: what the tabs are. */
  label: string
  tabs: TabBoxTab[]
}) {
  return (
    <Tabs className="min-w-0 rounded-lg bg-surface shadow-card">
      <TabList aria-label={label} className="flex overflow-x-auto border-b border-border px-2">
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            id={tab.id}
            className="flex min-h-touch shrink-0 cursor-pointer items-center border-b-2 border-transparent px-3 font-display font-bold text-muted outline-none hover:text-text selected:border-primary selected:text-primary focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-focus"
          >
            {tab.title}
          </Tab>
        ))}
      </TabList>
      {tabs.map((tab) => (
        <TabPanel key={tab.id} id={tab.id} className="p-4 outline-none focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-focus">
          {tab.content}
        </TabPanel>
      ))}
    </Tabs>
  )
}
