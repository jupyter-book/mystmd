/* eslint-disable no-param-reassign */
import MarkdownIt from 'markdown-it';
import StateInline from 'markdown-it/lib/rules_inline/state_inline';
import { getRole, addRenderers } from './roles';

// Ported from https://github.com/executablebooks/markdown-it-py/blob/master/markdown_it/extensions/myst_role/index.py
// MIT License: https://github.com/executablebooks/markdown-it-py/blob/master/LICENSE

const PATTERN = /^\{([a-zA-Z_\-+:]{1,36})\}(`+)(?!`)(.+?)(?<!`)\2(?!`)/; // e.g. {role}`text`

function myst_role(state: StateInline, silent: boolean) {
  if (state.src.charCodeAt(state.pos - 1) === 0x5C) { /* \ */
    // escaped (this could be improved in the case of edge case '\\{')
    return false;
  }
  const match = PATTERN.exec(state.src.slice(state.pos));
  if (match == null) return false;
  const [str, name, , content] = match;
  state.pos += str.length;

  if (!silent) {
    const role = getRole(name, content);
    const token = state.push(role.token, '', 0);
    Object.entries(role.attrs).map(([k, v]) => token.attrSet(k, v));
    token.meta = { name };
    token.content = role.content;
  }
  return true;
}

export function myst_role_plugin(md: MarkdownIt) {
  md.inline.ruler.before('backticks', 'myst_role', myst_role);
  addRenderers(md);
}
