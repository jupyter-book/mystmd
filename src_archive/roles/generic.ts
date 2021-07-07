import { Role } from './types'
import { toHTML } from '../utils'

const roles = {
  myst_role: {
    token: 'myst_role',
    renderer: (tokens, idx) => {
      const token = tokens[idx]
      const name = token.meta?.name ?? 'unknown'
      const [html] = toHTML(
        ['code', { class: 'myst-role', children: `{${name}}\`${token.content}\`` }],
        { inline: true }
      )
      return html
    }
  } as Role
}

export default roles
