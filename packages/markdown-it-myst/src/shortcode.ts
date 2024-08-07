import type MarkdownIt from 'markdown-it/lib';
import type StateCore from 'markdown-it/lib/rules_core/state_core.js';
import type StateInline from 'markdown-it/lib/rules_inline/state_inline.js';
import { nestedPartToTokens } from './nestedParse.js';

export function shortcodePlugin(md: MarkdownIt): void {
  md.inline.ruler.before('backticks', 'parse_short_codes', shortCodeRule);
}

// Hugo short code syntax e.g. {{< role value >}}
const ROLE_PATTERN = /^\{\{\<\s*([a-z0-9_\-+:]{1,36})\s*([^>]*)\s*\>\}\}/;

function shortCodeRule(state: StateInline, silent: boolean): boolean {
  // Check if the role is escaped
  if (state.src.charCodeAt(state.pos - 1) === 0x5c) {
    /* \ */
    // TODO: this could be improved in the case of edge case '\\{', also multi-line
    return false;
  }
  const match = ROLE_PATTERN.exec(state.src.slice(state.pos));
  if (match == null) return false;
  const [str, name, content] = match;
  if (!silent) {
    const token = state.push('role', '', 0);
    token.meta = { name };
    token.content = content?.trim();
    (token as any).col = [state.pos, state.pos + str.length];
  }
  state.pos += str.length;
  return true;
}
