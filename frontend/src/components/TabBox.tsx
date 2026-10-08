import type { ReactNode } from 'react'
import { Tab, TabList, TabPanel, Tabs } from 'react-aria-components'

export interface TabBoxTab {
  id: string
  title: string
  content: ReactNode
}

/**
 * A box with tabs over it, as the tabs of a folder: one of its parts shows at a time, picked by its title, and
 * the title of the part on show is filled with the main color. The first one shows at first.
 * It may be narrower than its content (min-w-0), as a Card, and its titles scroll sideways when they do not fit.
 */
export function TabBox({ label, tabs }: {
  /** For screen readers: what the tabs are. */
  label: string
  tabs: TabBoxTab[]
}) {
  return (
    <Tabs className="min-w-0">
      <TabList aria-label={label} className="flex gap-1 overflow-x-auto">
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            id={tab.id}
            className="flex min-h-9 shrink-0 grow cursor-pointer items-center justify-center rounded-t-lg bg-surface-sunken px-2.5 font-display text-base font-bold text-text outline-none hover:bg-border selected:bg-primary selected:text-on-primary focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-focus sm:grow-0 sm:px-6"
          >
            {tab.title}
          </Tab>
        ))}
      </TabList>
      {tabs.map((tab) => (
        // The line over the box joins it to the tab on show.
        <TabPanel
          key={tab.id}
          id={tab.id}
          className="rounded-b-lg border-t-3 border-primary bg-surface p-4 shadow-card outline-none focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-focus"
        >
          {tab.content}
        </TabPanel>
      ))}
    </Tabs>
  )
}
