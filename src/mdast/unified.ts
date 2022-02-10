import { Root } from 'mdast'
import type { Plugin } from 'unified'
import { tokensToMyst } from './tokensToMyst'
import { MyST, Options } from '../myst'

export const jsonParser: Plugin<void[], string, Root> = function jsonParser() {
  this.Parser = (json: string) => JSON.parse(json)
}

export const mystParser: Plugin<[Options?] | void[], string, Root> =
  function mystParser() {
    this.Parser = (content: string) => {
      return tokensToMyst(MyST().parse(content, {}))
    }
  }
