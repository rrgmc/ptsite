const CORE = '+ptsite.'

/**
 * The site's version and the core's, from the version of a site's build, such as "v3.0.0+ptsite.v1.8.0"
 * (docs/architecture/deployment.md, "Releases"). The core's own build has one version, so it has no `core`.
 */
export function splitVersion(version: string): { site: string; core?: string } {
  const at = version.indexOf(CORE)
  return at < 0 ? { site: version } : { site: version.slice(0, at), core: version.slice(at + CORE.length) }
}
