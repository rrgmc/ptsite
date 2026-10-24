import { markNames } from './recapText'

/** A recap's text as typed, with its line breaks, and each player's nickname in bold. */
export function RecapBody({ text, nicknames }: { text: string; nicknames: string[] }) {
  return (
    <p className="whitespace-pre-line wrap-anywhere">
      {markNames(text, nicknames).map((segment, i) => (segment.name ? <strong key={i}>{segment.text}</strong> : segment.text))}
    </p>
  )
}
