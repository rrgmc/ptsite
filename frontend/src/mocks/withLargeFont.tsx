import { type ReactElement, useEffect, useState } from 'react'

/**
 * A story decorator that shows the story on a phone set to its largest font: the page's base font at twice its
 * size, in a frame as wide as a small phone.
 */
export function withLargeFont() {
  return function WithLargeFont(Story: () => ReactElement) {
    // Set before the story's first render, and put back when the story leaves.
    const [restore] = useState(() => {
      const root = document.documentElement
      const before = root.style.fontSize
      root.style.fontSize = '200%'
      return () => {
        root.style.fontSize = before
      }
    })
    useEffect(() => restore, [restore])
    return (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    )
  }
}
