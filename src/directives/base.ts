/** This plugin implements initial identification
 * and conversion of fenced tokens to directive tokens.
 *
 * A directive looks like:
 *
 * ```{name} possible text1
 * possible text2
 *
 * possible text3
 * ```
 * 
 * which will be initially parsed be by markdown-it to the token:
 * {
    "type": "fence",
    "tag": "code",
    "attrs": null,
    "map": [],
    "nesting": 0,
    "level": 0,
    "children": null,
    "content": "possible text2\n\npossible text3\n",
    "markup": "```",
    "info": "{name} possible text1",
    "meta": null,
    "block": true,
    "hidden": false
 * }
 *
 * We first use this plugin to convert these token to directive_base tokens.
 * This is run as a core function,
 * soon after the body tokens have been parsed,
 * and before handling of specific directives and the inline parsing.
 * 
 * Note (annoyingly) sphinx's format for directives does not allow
 * us to generically identify the three components of a directive:
 * arguments, options and body,
 * since this is dependant on the directive specification for a certain directive.
 * We may want to decide whether to make the spec more rigid in the future?
 * 
 */

import MarkdownIt from 'markdown-it'
import { RuleCore } from 'markdown-it/lib/parser_core'

const DIRECTIVE_PATTERN = /^\{([a-z]*)\}\s*(.*)$/

/** Plugin for converting fence tokens to directive_base base ones
 * These tokens would not be expected to be output in the final output
 * Instead they will be converted by subsequent plugins based on the directive name.
 *
 * @param regex to identify a fence info line as a directive
 * @param logError console.error if the render method is called
 */
export default function pluginDirectiveBase(
  md: MarkdownIt,
  regex = DIRECTIVE_PATTERN,
  logError = true
): void {
  // TODO also convert colon-fences
  md.core.ruler.after('block', 'directive_base', convertFences(regex))

  // basic renderer for unhandled directive tokens
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  md.renderer.rules.directive_base = (tokens, idx, options, env, slf) => {
    const token = tokens[idx]
    if (logError) {
      console.error('unexpected "directive_base" token', token)
    }
    return `<pre><code>\n${token.info}: ${token.meta.arg}\n\n${token.content}\n</code></pre>\n`
  }
}

/** Convert fences identified as directives */
const convertFences =
  (regex: RegExp): RuleCore =>
  state => {
    for (const token of state.tokens) {
      if (token.type === 'fence') {
        const match = token.info.match(regex)
        if (match) {
          token.type = 'directive_base'
          token.info = match[1]
          token.meta = { arg: match[2] }
        }
      }
    }
    return true
  }
