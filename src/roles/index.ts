import MarkdownIt from 'markdown-it';
import StateInline from 'markdown-it/lib/rules_inline/state_inline';
import htmlRoles from './html';
import mathRoles from './math';
import referenceRoles from './references';
import genericRoles from './generic';
import { RoleConstructor, Role } from './types';

// Ported from https://github.com/executablebooks/markdown-it-py/blob/master/markdown_it/extensions/myst_role/index.py
// MIT License: https://github.com/executablebooks/markdown-it-py/blob/master/LICENSE

const knownRoles: Record<string, RoleConstructor> = {
  ...htmlRoles,
  ...mathRoles,
  ...referenceRoles,
  ...genericRoles,
};

function getRole(name: string, content: string): Role {
  const roleF = knownRoles[name] ?? genericRoles.myst_role;
  if (roleF.getAttrs) {
    const { attrs, content: modified } = roleF.getAttrs(content);
    return { token: roleF.token, attrs: attrs ?? {}, content: modified ?? content };
  }
  return { token: roleF.token, attrs: roleF.attrs ?? {}, content };
}

function addRenderers(md: MarkdownIt) {
  const { renderer } = md;
  Object.entries(knownRoles).forEach(([, { token, renderer: tokenRendered }]) => {
    // Early return if the role is already defined
    // e.g. math_inline might be better handled by another plugin
    if (md.renderer.rules[token]) return;
    renderer.rules[token] = tokenRendered;
  });
}

const PATTERN = /^\{([a-zA-Z_\-+:]{1,36})\}(`+)(?!`)(.+?)(?<!`)\2(?!`)/; // e.g. {role}`text`

function myst_role(state: StateInline, silent: boolean) {
  if (state.src.charCodeAt(state.pos - 1) === 0x5C) { /* \ */
    // escaped (this could be improved in the case of edge case '\\{')
    return false;
  }
  const match = PATTERN.exec(state.src.slice(state.pos));
  if (match == null) return false;
  const [str, name, , content] = match;
  // eslint-disable-next-line no-param-reassign
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
