import { toHTML } from '../utils'
import { Role } from './types'

const ABBR_PATTERN = /^(.+?)\(([^()]+)\)$/ // e.g. 'CSS (Cascading Style Sheets)'

const roles = {
  abbr: {
    token: 'abbr',
    getAttrs(content) {
      const match = ABBR_PATTERN.exec(content)
      if (match == null) return { attrs: { title: null }, content }
      const [, modified, title] = match
      return { attrs: { title: title.trim() }, content: modified.trim() }
    },
    renderer: (tokens, idx) => {
      const token = tokens[idx]
      const [html] = toHTML(
        ['abbr', { title: token.attrGet('title'), children: token.content }],
        { inline: true }
      )
      return html
    }
  } as Role,
  sub: {
    token: 'sub',
    renderer: (tokens, idx) => {
      const [html] = toHTML(['sub', { children: tokens[idx].content }], {
        inline: true
      })
      return html
    }
  } as Role,
  sup: {
    token: 'sup',
    renderer: (tokens, idx) => {
      const [html] = toHTML(['sup', { children: tokens[idx].content }], {
        inline: true
      })
      return html
    }
  } as Role
}

export default roles
