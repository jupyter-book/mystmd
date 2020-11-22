import MarkdownIt from 'markdown-it';
import StateInline from 'markdown-it/lib/rules_inline/state_inline';
import generic from './generic';
import { Role, Roles } from './types';

// Ported from https://github.com/executablebooks/markdown-it-py/blob/master/markdown_it/extensions/myst_role/index.py
// MIT License: https://github.com/executablebooks/markdown-it-py/blob/master/LICENSE

// e.g. {role}`text`
const ROLE_PATTERN = /^\{([a-zA-Z_\-+:]{1,36})\}(`+)(?!`)(.+?)(?<!`)\2(?!`)/;

const getRole = (roles: Roles) => (name: string, content: string): Role => {
  const roleF = roles[name] ?? generic.myst_role;
  if (roleF.getAttrs) {
    const { attrs, content: modified } = roleF.getAttrs(content);
    return { token: roleF.token, attrs: attrs ?? {}, content: modified ?? content };
  }
  return { token: roleF.token, attrs: roleF.attrs ?? {}, content };
};

const addRenderers = (roles: Roles) => (md: MarkdownIt) => {
  const { renderer } = md;
  Object.entries(roles).forEach(([, { token, renderer: tokenRendered }]) => {
    // Early return if the role is already defined
    // e.g. math_inline might be better handled by another plugin
    if (md.renderer.rules[token]) return;
    renderer.rules[token] = tokenRendered;
  });
};

const myst_role = (roles: Roles) => (state: StateInline, silent: boolean) => {
  // Check if the role is escaped
  if (state.src.charCodeAt(state.pos - 1) === 0x5C) { /* \ */
    // TODO: this could be improved in the case of edge case '\\{'
    return false;
  }
  const match = ROLE_PATTERN.exec(state.src.slice(state.pos));
  if (match == null) return false;
  const [str, name, , content] = match;
  // eslint-disable-next-line no-param-reassign
  state.pos += str.length;

  if (!silent) {
    const role = getRole(roles)(name, content);
    const token = state.push(role.token, '', 0);
    Object.entries(role.attrs).map(([k, v]) => token.attrSet(k, v));
    token.meta = { name };
    token.content = role.content;
  }
  return true;
};

export const myst_role_plugin = (roles: Roles) => (md: MarkdownIt) => {
  md.inline.ruler.before('backticks', 'myst_role', myst_role(roles));
  addRenderers(roles)(md);
};
