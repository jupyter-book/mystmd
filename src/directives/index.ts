import admonitions from './admonition'
import figure from './figure'
import math from './math'
import { Directive, Directives } from './types'

export const directives: Directives = {
  ...admonitions,
  ...figure,
  ...math
}

export { plugin } from './plugin'
export type { Directive, Directives }
