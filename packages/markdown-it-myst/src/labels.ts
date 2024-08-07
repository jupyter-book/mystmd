import MarkdownIt from 'markdown-it/lib';
import StateInline from 'markdown-it/lib/rules_inline/state_inline.js';

const LABEL_PATTERN = /^\{\#(.+?)\}/im;

const LABEL_TOKEN_NAME = 'myst_target';

function labelRule(state: StateInline, silent: boolean): boolean {
  // Check if the label is escaped
  if (state.src.charCodeAt(state.pos - 1) === 0x5c) {
    /* \ */
    // TODO: this could be improved in the case of edge case '\\{', also multi-line
    return false;
  }
  const match = LABEL_PATTERN.exec(state.src.slice(state.pos));
  if (match == null) return false;
  const [str, content] = match;
  if (!silent) {
    const token = state.push(LABEL_TOKEN_NAME, '', 0);
    token.content = content;
    (token as any).col = [state.pos, state.pos + str.length];
  }
  state.pos += str.length;
  return true;
}

export function labelsPlugin(md: MarkdownIt): void {
  md.inline.ruler.before('backticks', `parse_${LABEL_TOKEN_NAME}`, labelRule);
}
