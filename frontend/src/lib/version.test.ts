import { expect, it } from 'vitest'
import { splitVersion } from './version'

it("splits a site's version into the site's and the core's", () => {
  expect(splitVersion('v3.0.0+ptsite.v1.8.0')).toEqual({ site: 'v3.0.0', core: 'v1.8.0' })
  expect(splitVersion('v3.0.0-2-gabc1234+ptsite.v1.8.0-1-gdef5678-dirty')).toEqual({ site: 'v3.0.0-2-gabc1234', core: 'v1.8.0-1-gdef5678-dirty' })
})

it("keeps the core's own version whole", () => {
  expect(splitVersion('v1.8.0')).toEqual({ site: 'v1.8.0' })
  expect(splitVersion('dev')).toEqual({ site: 'dev' })
})
