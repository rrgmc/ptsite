import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { loadSite } from '../../site-settings'
import { FEATURE_DEFAULTS, featureProblems, resolveFeatures } from './features'

describe('resolveFeatures', () => {
  it('gives every feature its default when the site names none', () => {
    expect(resolveFeatures(undefined)).toEqual(FEATURE_DEFAULTS)
  })

  it('turns off only the features the site sets to false', () => {
    expect(resolveFeatures({ timeChip: false })).toEqual({ ...FEATURE_DEFAULTS, timeChip: false })
  })
})

describe('featureProblems', () => {
  it('finds nothing wrong with no features, or with known ones set to true or false', () => {
    expect(featureProblems(undefined)).toEqual([])
    expect(featureProblems({ mainEventPot: false, seasonPlanner: true })).toEqual([])
  })

  it('names a feature it does not know, and lists the ones it knows', () => {
    const [problem] = featureProblems({ bingo: true })

    expect(problem).toContain('"bingo"')
    expect(problem).toContain('seasonPlanner')
  })

  it('refuses a value that is not true or false, and a list in place of the object', () => {
    expect(featureProblems({ timeChip: 'no' })).toEqual(['"features.timeChip" must be true or false.'])
    expect(featureProblems(['timeChip'])).toHaveLength(1)
  })
})

// Vitest runs in the frontend folder.
it('has the same features as the backend', () => {
  const php = readFileSync(resolve('../backend/src/Domain/Features/Feature.php'), 'utf8')
  const backend = [...php.matchAll(/case \w+ = '(\w+)';/g)].map((match) => match[1])

  expect(backend.sort()).toEqual(Object.keys(FEATURE_DEFAULTS).sort())
})

describe('loadSite', () => {
  const demo = JSON.parse(readFileSync(resolve('../site/site.json'), 'utf8')) as Record<string, unknown>
  const siteWith = (features: unknown) => {
    const dir = mkdtempSync(join(tmpdir(), 'ptsite-site-'))
    writeFileSync(join(dir, 'site.json'), JSON.stringify({ ...demo, features }))
    return dir
  }

  it('reads the features of site.json', () => {
    const dir = siteWith({ seasonPlanner: false })

    expect(loadSite(dir).features).toEqual({ ...FEATURE_DEFAULTS, seasonPlanner: false })
    rmSync(dir, { recursive: true })
  })

  it('stops the build on a feature it does not know', () => {
    const dir = siteWith({ nope: true })

    expect(() => loadSite(dir)).toThrow('"nope"')
    rmSync(dir, { recursive: true })
  })
})
