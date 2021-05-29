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
export type admonitionSettings = {
  [key: string]: { spec: IDirectiveSpec; title?: string }
}

/** List of default admonitions */
export const defaultAdmonitions: admonitionSettings = {
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

export default function pluginDirectiveAdmonition(
  md: MarkdownIt,
  admonitions = defaultAdmonitions
): void {
  md.core.ruler.after(
    'directive_base',
    'directive_admonition',
    parseAdmonitions(admonitions)
  )
}

const parseAdmonitions =
  (admonitions: admonitionSettings): RuleCore =>
  state => {
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
      try {
        ;({ args, options, body } = parseStructure(
          token.info,
          token.content,
          admonitions[token.info].spec
        ))
      } catch (error) {
        // TODO handle error (also discriminate DirectiveParsingError)
        continue
      }
      // The title is either specified directly or will be the first argument
      const title = admonitions[token.info].title || args[0] || ''
      // we want the title to be parsed as Markdown during the inline phase
      const titleToken = new Token('inline', '', 0)
      titleToken.map = token.map ? [token.map[0], token.map[0]] : null
      titleToken.content = title
      titleToken.children = []
      // run a recursive parse on the content of the admonition upto this stage
      const bodyTokens: Token[] = nestedCoreParse(
        state.md,
        'directive_admonition',
        body,
        state.env
      )
      // now add the new tokens, in place of the original one
      // we create an overall container, then individual containers for the title and body
      const adToken = new Token('open_admonition', 'aside', 1)
      const classes = ['admonition', token.meta.args]
      if (options.class && options.class.length) {
        classes.push(...options.class)
      }
      adToken.attrSet('class', classes.join(' '))
      newTokens.push(adToken)
      const adTokenTitle = new Token('open_admonition_title', 'div', 1)
      adTokenTitle.attrSet('class', 'admonition-title')
      newTokens.push(adTokenTitle)
      newTokens.push(titleToken)
      newTokens.push(new Token('close_admonition_title', 'div', -1))
      const adTokenBody = new Token('open_admonition_body', 'div', 1)
      adTokenBody.attrSet('class', 'admonition-body')
      newTokens.push(adTokenBody)
      newTokens.push(...bodyTokens)
      newTokens.push(new Token('close_admonition_body', 'div', 1))
      newTokens.push(new Token('close_admonition', 'aside', -1))
    }
    state.tokens = newTokens
    return true
  }

/** Perform a nested parse upto and including the ruleName of our plugin */
function nestedCoreParse(
  md: MarkdownIt,
  pluginRuleName: string,
  src: string,
  env: any
): Token[] {
  // disable all core rules after pluginRuleName
  const tempDisabledCore: string[] = []
  // TODO __rules__ is currently not exposed in typescript, but is the only way to get the rule names,
  // since md.core.ruler.getRules('') only returns the rule functions
  // we should upstream a getRuleNames() function or similar
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore TS2339
  for (const rule of [...md.core.ruler.__rules__].reverse()) {
    if (rule.name === pluginRuleName) {
      break
    }
    if (rule.name) {
      tempDisabledCore.push(rule.name)
    }
  }

  md.core.ruler.disable(tempDisabledCore)

  let tokens = []
  try {
    tokens = md.parse(src, env)
  } finally {
    md.core.ruler.enable(tempDisabledCore)
  }
  return tokens
}
