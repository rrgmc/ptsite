import { Card } from '@/components/Card'
import { Badge } from '@/components/Feedback'
import { t } from '@/i18n'
import { hasFeature } from '@/lib/features'
import { splitVersion } from '@/lib/version'
import { FEATURE_DEFAULTS, type FeatureName } from '@/site/features'

const featureNames = Object.keys(FEATURE_DEFAULTS) as FeatureName[]

/**
 * "Configurações": what this site was built with, to read only. The features and the version are build
 * information, so they come from the bundle and not from the API (docs/decisions/0018 and 0021).
 */
export function SettingsAdmin({ version = __APP_VERSION__ }: { version?: string }) {
  const s = t.admin.settings
  const { site, core } = splitVersion(version)
  const versions = core === undefined ? [[s.version, site]] : [[s.siteVersion, site], [s.coreVersion, core]]

  return (
    <div className="flex flex-col gap-4">
      <Card title={s.featuresTitle}>
        <p className="mb-3 text-sm text-muted">{s.featuresIntro}</p>
        <ul className="divide-y divide-border/60">
          {featureNames.map((name) => (
            <li key={name} className="flex min-h-touch items-center justify-between gap-3 px-2 py-2 even:bg-surface-stripe">
              <span className="min-w-0 wrap-break-word">
                <span className="block font-semibold">{s.features[name].name}</span>
                <span className="block text-sm text-muted">{s.features[name].description}</span>
              </span>
              <span className="shrink-0">
                {hasFeature(name) ? <Badge tone="primary">{s.on}</Badge> : <Badge>{s.off}</Badge>}
              </span>
            </li>
          ))}
        </ul>
      </Card>
      <Card title={s.versionTitle}>
        <dl className="divide-y divide-border/60">
          {versions.map(([label, value]) => (
            <div key={label} className="flex min-h-touch flex-wrap items-center justify-between gap-x-3 px-2 py-2 even:bg-surface-stripe">
              <dt className="text-muted">{label}</dt>
              <dd className="tabular font-semibold wrap-anywhere">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  )
}
