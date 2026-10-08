// The features a site can turn off in the "features" of its site.json (site/README.md). Plain functions with no
// browser API: the build uses them (site-settings.ts) and so do the tests.
//
// The backend has the same list in backend/src/Domain/Features/Feature.php, and a test compares the two. To add
// a feature: docs/architecture/frontend.md, "Feature flags".

/** Every feature, with whether a site that does not name it has it. */
export const FEATURE_DEFAULTS = {
  /** "Pote ME": the money a night sets aside for the Main Event. */
  mainEventPot: true,
  /** "Time chip": the money a night sets aside for the year party. */
  timeChip: true,
  /** "Planejar datas": the calendar that schedules a season's regular nights at once. */
  seasonPlanner: true,
  /** "Main Event": a night of its own type, finished with the order of its players and no points. Off unless a site turns it on. */
  mainEvent: false,
}

export type FeatureName = keyof typeof FEATURE_DEFAULTS
export type Features = Record<FeatureName, boolean>

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

/** What is wrong with the "features" of a site.json, as plain sentences. Nothing wrong: an empty list. */
export function featureProblems(raw: unknown): string[] {
  if (raw === undefined) return []
  if (!isObject(raw)) return ['"features" must be an object, such as { "timeChip": false }.']
  const known = Object.keys(FEATURE_DEFAULTS)
  return Object.entries(raw).flatMap(([name, value]) => {
    if (!known.includes(name)) return [`"features" has no "${name}". The features are: ${known.join(', ')}.`]
    return typeof value === 'boolean' ? [] : [`"features.${name}" must be true or false.`]
  })
}

/** The site's features, with the default for each one it leaves out. */
export function resolveFeatures(raw: unknown): Features {
  const given = isObject(raw) ? raw : {}
  return Object.fromEntries(
    Object.entries(FEATURE_DEFAULTS).map(([name, byDefault]) => [name, typeof given[name] === 'boolean' ? given[name] : byDefault]),
  ) as Features
}
