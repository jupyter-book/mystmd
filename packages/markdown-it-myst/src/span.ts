import type MarkdownIt from 'markdown-it/lib';
import type StateCore from 'markdown-it/lib/rules_core/state_core.js';
import type StateInline from 'markdown-it/lib/rules_inline/state_inline.js';
import { nestedPartToTokens } from './nestedParse.js';

export function spanPlugin(md: MarkdownIt): void {
  md.inline.ruler.before('backticks', 'parse_span', spanRule);
}

// Inline span syntax e.g. [markdown]{.class}
const ROLE_PATTERN = /^\[([^\]]*)\]\{([^\}]*)\}/;

function spanRule(state: StateInline, silent: boolean): boolean {
  // Check if the role is escaped
  if (state.src.charCodeAt(state.pos - 1) === 0x5c) {
    /* \ */
    // TODO: this could be improved in the case of edge case '\\[', also multi-line
    return false;
  }
  const match = ROLE_PATTERN.exec(state.src.slice(state.pos));
  if (match == null) return false;
  const [str, content, options] = match;
  if (!silent) {
    const token = state.push('role', '', 0);
    const classes = options
      .split(' ')
      .map((c) => c.trim().replace(/^\./, ''))
      .filter((c) => !!c);
    token.meta = { name: 'span', options: { class: classes.join(' ') } };
    token.content = content?.trim();
    (token as any).col = [state.pos, state.pos + str.length];
  }
  state.pos += str.length;
  return true;
}
