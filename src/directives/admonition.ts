/** This plugin handles the parsing of "sphinx-like" admonitions
 *
 * It should be run after directive_base and before inline parsing
 *
 * Recursive
 *
 */

import MarkdownIt from 'markdown-it'
import Token from 'markdown-it/lib/token'
import { RuleCore } from 'markdown-it/lib/parser_core'

import parseStructure, { IDirectiveSpec } from './parseStructure'
import { unchanged, class_option } from './optionConverters'
import { nestedCoreParse } from './nestedCoreParse'

export const baseAdmonitionSpec = {
  final_argument_whitespace: true,
  option_spec: {
    class: class_option,
    // TODO handle name
    name: unchanged
  },
  has_content: true
}

/** Data required to parse an admonition type */
export interface IAdmonitionSettings {
  /** The mapping of directive names to their spec and title */
  admonitions?: { [key: string]: { spec: IDirectiveSpec; title?: string } }
  /** The HTML tags to apply for each component of the directive */
  tags?: {
    main: string
    title: string
    body: string
  }
}

/** List of default admonitions */
export const defaultAdmonitions: {
  [key: string]: { spec: IDirectiveSpec; title?: string }
} = {
  admonition: {
    spec: {
      ...baseAdmonitionSpec,
      required_arguments: 1
    }
  },
  attention: {
    spec: baseAdmonitionSpec,
    title: 'Attention'
  },
  caution: {
    spec: baseAdmonitionSpec,
    title: 'Caution'
  },
  danger: {
    spec: baseAdmonitionSpec,
    title: 'Danger'
  },
  error: {
    spec: baseAdmonitionSpec,
    title: 'Error'
  },
  important: {
    spec: baseAdmonitionSpec,
    title: 'Important'
  },
  hint: {
    spec: baseAdmonitionSpec,
    title: 'Hint'
  },
  note: {
    spec: baseAdmonitionSpec,
    title: 'Note'
  },
  seealso: {
    spec: baseAdmonitionSpec,
    title: 'See Also'
  },
  tip: {
    spec: baseAdmonitionSpec,
    title: 'Tip'
  },
  warning: {
    spec: baseAdmonitionSpec,
    title: 'Warning'
  }
}

const defaultTags = {
  main: 'aside',
  title: 'div',
  body: 'div'
}

/**
 * @param md the markdown it instance
 * @param settings setting for the plugin
 *
 */
export default function pluginDirectiveAdmonition(
  md: MarkdownIt,
  settings: IAdmonitionSettings
): void {
  md.core.ruler.after(
    'directive_base',
    'directive_admonition',
    admonitionsToTokens(settings)
  )
}

const admonitionsToTokens =
  (settings: IAdmonitionSettings): RuleCore =>
  state => {
    const admonitions = settings?.admonitions || defaultAdmonitions
    const tags = settings?.tags || defaultTags
    const newTokens: Token[] = []
    for (const token of state.tokens) {
      if (token.type !== 'directive_base' || !(token.info in admonitions)) {
        newTokens.push(token)
        continue
      }
      // parse the directive structure
      let args
      let options
      let body
      let bodyOffset
      try {
        ;({ args, options, body, bodyOffset } = parseStructure(
          token.meta.arg || '',
          token.content,
          admonitions[token.info].spec
        ))
      } catch (error) {
        // TODO handle error (also discriminate DirectiveParsingError)
        // Maybe change to a special "error" token
        continue
      }
      // The title is either specified directly or will be the first argument
      const title = admonitions[token.info].title || args[0] || ''
      // we want the title to be parsed as Markdown during the inline phase
      const titleToken = new Token('inline', '', 0)
      titleToken.map = token.map !== null ? [token.map[0], token.map[0]] : null
      titleToken.content = title
      titleToken.children = []
      // run a recursive parse on the content of the admonition upto this stage
      const bodyTokens: Token[] = nestedCoreParse(
        state.md,
        'directive_admonition',
        body,
        state.env,
        token.map !== null ? token.map[0] + bodyOffset : bodyOffset
      )
      // now add the new tokens, in place of the original one
      // we create an overall container, then individual containers for the title and body
      const adToken = new Token('open_admonition', tags.main, 1)
      adToken.map = token.map
      let classes = [token.info]
      if (token.info !== 'admonition') {
        classes = ['admonition', token.info]
      }
      if (options.class && options.class.length) {
        classes.push(...options.class)
      }
      adToken.attrSet('class', classes.join(' '))
      newTokens.push(adToken)
      const adTokenTitle = new Token('open_admonition_title', tags.title, 1)
      adTokenTitle.attrSet('class', 'admonition-title')
      newTokens.push(adTokenTitle)
      newTokens.push(titleToken)
      newTokens.push(new Token('close_admonition_title', tags.title, -1))
      const adTokenBody = new Token('open_admonition_body', tags.body, 1)
      adTokenBody.map = token.map !== null ? [token.map[0] + 1, token.map[1] - 1] : null
      adTokenBody.attrSet('class', 'admonition-body')
      newTokens.push(adTokenBody)
      newTokens.push(...bodyTokens)
      newTokens.push(new Token('close_admonition_body', tags.body, 1))
      newTokens.push(new Token('close_admonition', tags.main, -1))
    }
    state.tokens = newTokens
    return true
  }
