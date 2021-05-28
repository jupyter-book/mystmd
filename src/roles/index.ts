import html from './html'
import math from './math'
import reference from './references'
import generic from './generic'
import { Role, Roles } from './types'

export const roles: Record<string, Role> = {
  ...html,
  ...math,
  ...reference,
  ...generic
}

export { plugin } from './plugin'
export type { Role, Roles }
