/* eslint-disable no-param-reassign */
import MarkdownIt from 'markdown-it'
import Renderer from 'markdown-it/lib/renderer'
import container from 'markdown-it-container'
import Token from 'markdown-it/lib/token'
import { RuleCore } from 'markdown-it/lib/parser_core'
import parseOptions from './options'
import { Directive, Directives, DirectiveTokens } from './types'
import { newTarget, TargetKind, StateEnv } from '../state'
import { toHTML } from '../utils'

const DIRECTIVE_PATTERN = /^\{([a-z]*)\}\s*(.*)$/

type ContainerOpts = Parameters<typeof container>[2]

function getDirective(directives: Directives, kind: string | null) {
  if (!kind) return undefined
  return directives[kind]
}

/**
 * Container that continues to render internally.
 *
 * For not rendering the internals (e.g. math), use `skipParsing`
 * and the directive will modify a `fence` renderer.
 *
 * @param directives The directives to use
 */
const directiveContainer = (directives: Directives): ContainerOpts => ({
  marker: '`',
  validate(params) {
    const match = params.trim().match(DIRECTIVE_PATTERN)
    if (!match) return false
    const kind = match[1]
    const directive = getDirective(directives, kind)
    return Boolean(directive) && !directive?.skipParsing
  },
  render(tokens, idx, options, env, self) {
    const token = tokens[idx]
    const kind = token.attrGet('kind') ?? ''
    const directive = getDirective(directives, kind) as Directive
    const { args, opts, target } = token.meta
    const htmlTemplate = directive.renderer(
      args,
      opts,
      target,
      tokens,
      idx,
      options,
      env,
      self
    )
    const [before, after] = toHTML(htmlTemplate)
    return token.nesting === 1 ? before : after
  }
})

/**
 * This overrides the `fence` when `skipParsing` is set to true on a directive.
 *
 * @param directives The directives to use
 */
const fenceRenderer =
  (directives: Directives) =>
  (
    tokens: Token[],
    idx: number,
    options: MarkdownIt.Options,
    env: StateEnv,
    self: Renderer
  ) => {
    const token = tokens[idx]
    const kind = token.attrGet('kind') ?? ''
    const directive = getDirective(directives, kind) as Directive
    const { args, opts, target } = token.meta
    const htmlTemplate = directive.renderer(
      args,
      opts,
      target,
      tokens,
      idx,
      options,
      env,
      self
    )
    const [before, after] = toHTML(htmlTemplate)
    return `${before}${token.content}${after}`
  }

const setDirectiveKind =
  (directives: Directives): RuleCore =>
  state => {
    const { tokens } = state
    let kind: false | string = false
    for (let index = 0; index < tokens.length; index += 1) {
      const token = tokens[index]
      if (token.type === DirectiveTokens.open) {
        const match = token.info.trim().match(DIRECTIVE_PATTERN)
        const directive = getDirective(directives, match?.[1] ?? '')
        if (!directive)
          throw new Error(
            'Shoud not be able to get into here without having directive.'
          )
        kind = directive.token
        token.attrSet('kind', kind)
      }
      if (token.type === 'fence') {
        // Here we match the directives that `skipParsing`, and turn them into `directive_fences`
        // The options are then added as normal, the rendering is done in `fenceRenderer`
        const match = token.info.trim().match(DIRECTIVE_PATTERN)
        const directive = getDirective(directives, match?.[1] ?? '')
        if (directive && directive.skipParsing) {
          token.type = DirectiveTokens.fence
          kind = directive.token
          token.attrSet('kind', kind)
        }
      }
      if (token.type === DirectiveTokens.close) {
        // Set the kind on the closing container as well, as that will have to render the closing tags
        token.attrSet('kind', kind as string)
        kind = false
      }
    }
    return true
  }

const parseArguments =
  (directives: Directives): RuleCore =>
  state => {
    const { tokens } = state
    let parent: Token | false = false
    // If there is a title on the first line when not required, bump it to the first inline
    let bumpArguments = ''
    for (let index = 0; index < tokens.length; index += 1) {
      const token = tokens[index]
      if (token.type === DirectiveTokens.open) {
        parent = token
        const match = token.info.trim().match(DIRECTIVE_PATTERN)
        const directive = getDirective(directives, token.attrGet('kind'))
        if (!match || !directive)
          throw new Error('Shoud not be able to get into here without matching?')
        const info = match[2].trim()
        const { args, content: modified } = directive.getArguments?.(info) ?? {}
        token.meta = { ...token.meta, args }
        if (modified) bumpArguments = modified
      }
      if (token.type === DirectiveTokens.fence) {
        const match = token.info.trim().match(DIRECTIVE_PATTERN)
        const directive = getDirective(directives, token.attrGet('kind'))
        if (!match || !directive)
          throw new Error('Shoud not be able to get into here without matching?')
        const info = match[2].trim()
        const { args, content: modified } = directive.getArguments?.(info) ?? {}
        token.meta = { ...token.meta, args }
        if (modified) token.content = modified + token.content
      }
      if (parent && token.type === DirectiveTokens.close) {
        // TODO: https://github.com/executablebooks/MyST-Parser/issues/154
        // If the bumped title needs to be rendered - put it here somehow.
        bumpArguments = ''
        token.meta = parent.meta
        parent = false
      }
      if (parent && bumpArguments && token.type === 'inline') {
        token.content = `${bumpArguments} ${token.content}`
        bumpArguments = ''
      }
    }
    return true
  }

const numbering =
  (directives: Directives): RuleCore =>
  state => {
    const { tokens } = state
    for (let index = 0; index < tokens.length; index += 1) {
      const token = tokens[index]
      if (token.type === DirectiveTokens.open || token.type === DirectiveTokens.fence) {
        const directive = getDirective(directives, token.attrGet('kind'))
        const { name } = token.meta?.opts
        /* Only number things if:
         *    * the directive supports numbering
         *    * AND a name is provided
         *    * OR autoNumber for the directive is on
         */
        if (directive?.numbered && (name || directive?.autoNumber)) {
          const target = newTarget(state, name, directive.numbered)
          token.meta.target = target
        }
      }
      if (token.type === 'math_block_eqno') {
        // This is parsed using the markdownTexMath library, and the name comes on the info:
        const name = token.info
        const target = newTarget(state, name, TargetKind.equation)
        token.meta = { ...token.meta, target }
      }
    }
    return true
  }

export const plugin =
  (directives: Directives) =>
  (md: MarkdownIt): void => {
    const { renderer } = md
    md.use(container, 'directives', directiveContainer(directives))
    md.core.ruler.after('block', 'directive_kind', setDirectiveKind(directives))
    md.core.ruler.after(
      'directive_kind',
      'parse_directive_opts',
      parseOptions(directives)
    )
    md.core.ruler.after(
      'parse_directive_opts',
      'parse_directive_args',
      parseArguments(directives)
    )
    md.core.ruler.after('parse_directive_args', 'numbering', numbering(directives))
    renderer.rules[DirectiveTokens.fence] = fenceRenderer(directives)
  }
