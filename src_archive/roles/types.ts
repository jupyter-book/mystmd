import Token from 'markdown-it/lib/token'
import MarkdownIt from 'markdown-it'
import Renderer from 'markdown-it/lib/renderer'
import { StateEnv } from '../state'

type Attrs = Record<string, any>

export type Role = {
  token: string
  attrs?: Attrs
  getAttrs?: (content: string) => { attrs: Attrs; content?: string }
  renderer: (
    tokens: Token[],
    idx: number,
    options: MarkdownIt.Options,
    env: StateEnv,
    self: Renderer
  ) => string
}

export type Roles = Record<string, Role>
