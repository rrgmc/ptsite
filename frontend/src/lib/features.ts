import type { FeatureName, Features } from '@/site/features'
import { site } from '@/lib/site'

let overrides: Partial<Features> = {}

/** Whether this site has a feature it can turn off in its site.json (site/README.md, "Features"). */
export function hasFeature(name: FeatureName): boolean {
  return overrides[name] ?? site.features[name]
}

/**
 * For tests and stories only: the app is built with one site's features, and this shows a screen with others.
 * Returns the function that puts the site's own back.
 */
export function overrideFeatures(features: Partial<Features>): () => void {
  const before = overrides
  overrides = { ...overrides, ...features }
  return () => {
    overrides = before
  }
}
