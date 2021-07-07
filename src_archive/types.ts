import Token from 'markdown-it/lib/token'
import MarkdownIt from 'markdown-it'
import Renderer from 'markdown-it/lib/renderer'
import { IHTMLOutputSpecArray } from '../../src/utils'
import { StateEnv, TargetKind, Target } from '../../src/state'

export enum DirectiveTokens {
  open = 'container_directives_open',
  close = 'container_directives_close',
  fence = 'fence_directive',
  inline = 'inline'
}

type Dict = Record<string, any>

export type Directive<Args extends Dict = Dict, Opts extends Dict = Dict> = {
  token: string
  numbered?: TargetKind
  skipParsing?: true // Uses the fence instead of markdown-it-container. Does not parse internals.
  autoNumber?: true // Always give the directive a numbered reference (only works if numbered)
  getArguments: (info: string) => { args: Args; content?: string }
  getOptions: (data: Record<string, string>) => Opts
  renderer: (
    args: Args,
    opts: Opts,
    target: Target | undefined,
    tokens: Token[],
    idx: number,
    options: MarkdownIt.Options,
    env: StateEnv,
    self: Renderer
  ) => IHTMLOutputSpecArray
}

export type Directives = Record<string, Directive<any, any>>
