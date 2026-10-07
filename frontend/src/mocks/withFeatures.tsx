import { type ReactElement, useEffect, useState } from 'react'
import { overrideFeatures } from '@/lib/features'
import type { Features } from '@/site/features'

/** A story decorator that shows the story as a site with these features turned on or off sees it. */
export function withFeatures(features: Partial<Features>) {
  return function WithFeatures(Story: () => ReactElement) {
    // Set before the story's first render, and put back when the story leaves.
    const [restore] = useState(() => overrideFeatures(features))
    useEffect(() => restore, [restore])
    return <Story />
  }
}
