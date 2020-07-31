/* eslint-disable no-param-reassign */
import { escapeHtml } from 'markdown-it/lib/common/utils';
import Token from 'markdown-it/lib/token';
import MarkdownIt from 'markdown-it';
import Renderer from 'markdown-it/lib/renderer';
import { StateEnv, TargetKind } from './state';

const ABBR_PATTERN = /^(.+?)\(([^()]+)\)$/; // e.g. 'CSS (Cascading Style Sheets)'
const REF_PATTERN = /^(.+?)<([^<>]+)>$/; // e.g. 'Labeled Reference <ref>'

type Attrs = Record<string, any>;

export type Role = {
  token: string;
  content: string;
  attrs: Attrs;
};

type RoleConstructor = {
  token: string;
  attrs?: Attrs;
  getAttrs?: (content: string) => { attrs: Attrs; content?: string };
  renderer: (
    tokens: Token[], idx: number, options: MarkdownIt.Options, env: StateEnv, self: Renderer,
  ) => string;
};

const knownRoles: Record<string, RoleConstructor> = {
  math: {
    token: 'math_inline',
    renderer: (tokens, idx) => {
      const token = tokens[idx];
      return `<span class="math">${escapeHtml(token.content)}</span>`;
    },
  },
  abbr: {
    token: 'abbr',
    getAttrs(content) {
      const match = ABBR_PATTERN.exec(content);
      if (match == null) return { attrs: { title: '' }, content };
      const [, modified, title] = match;
      return { attrs: { title: title.trim() }, content: modified.trim() };
    },
    renderer: (tokens, idx) => {
      const token = tokens[idx];
      const title = token.attrGet('title') ?? '';
      const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
      return `<abbr${titleAttr}>${escapeHtml(token.content)}</abbr>`;
    },
  },
  sub: {
    token: 'sub',
    renderer: (tokens, idx) => {
      const token = tokens[idx];
      return `<sub>${escapeHtml(token.content)}</sub>`;
    },
  },
  sup: {
    token: 'sup',
    renderer: (tokens, idx) => {
      const token = tokens[idx];
      return `<sup>${escapeHtml(token.content)}</sup>`;
    },
  },
  ref: {
    token: 'ref',
    getAttrs(content) {
      const match = REF_PATTERN.exec(content);
      if (match == null) return { attrs: { ref: content }, content: '' };
      const [, modified, ref] = match;
      return { attrs: { ref: ref.trim() }, content: modified.trim() };
    },
    renderer: (tokens, idx, opts, env) => {
      const token = tokens[idx];
      const ref = token.attrGet('ref') ?? '';
      if (!env.targets[ref]) {
        return `<span style="background-color:red;" title="No reference '${escapeHtml(ref)}' found.">${escapeHtml(token.content ?? '')}</span>`;
      }
      const { name, title } = env.targets[ref] ?? {};
      return `<a href="#${name}" title="${title}">${escapeHtml(token.content || (title ?? ''))}</a>`;
    },
  },
  eq: {
    token: 'eq',
    getAttrs(content) {
      const match = REF_PATTERN.exec(content);
      if (match == null) return { attrs: { ref: content }, content: '' };
      const [, modified, ref] = match;
      return { attrs: { ref: ref.trim() }, content: modified.trim() };
    },
    renderer: (tokens, idx, opts, env) => {
      const token = tokens[idx];
      const ref = token.attrGet('ref') ?? '';
      const { kind, name, number } = env.targets[ref] ?? {};
      if (!env.targets[ref] || kind !== TargetKind.equation) {
        return `<span title="No equation '${escapeHtml(ref)}' found.">${escapeHtml(`${token.content ?? ''}⚠️`)}</span>`;
      }
      return `<a href="#${name}">${escapeHtml(token.content)}(${number})</a>`;
    },
  },
};

const genericRole: RoleConstructor = {
  token: 'myst_role',
  renderer: (tokens, idx) => {
    const token = tokens[idx];
    const name = token.meta?.name ?? 'unknown';
    return (
      `<code class="myst-role">{${name}}[${escapeHtml(token.content)}]</code>`
    );
  },
};

export function getRole(name: string, content: string): Role {
  const roleF = knownRoles[name] ?? genericRole;
  if (roleF.getAttrs) {
    const { attrs, content: modified } = roleF.getAttrs(content);
    return { token: roleF.token, attrs: attrs ?? {}, content: modified ?? content };
  }
  return { token: roleF.token, attrs: roleF.attrs ?? {}, content };
}

export function addRenderers(md: MarkdownIt) {
  Object.entries(knownRoles).forEach(([, { token, renderer }]) => {
    // Early return if the role is already defined
    // e.g. math_inline might be better handled by another plugin
    if (md.renderer.rules[token]) return;
    md.renderer.rules[token] = renderer;
  });
  md.renderer.rules[genericRole.token] = genericRole.renderer;
}
