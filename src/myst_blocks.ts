/* eslint-disable no-param-reassign */
import MarkdownIt from 'markdown-it';
import StateBlock from 'markdown-it/lib/rules_block/state_block';
import Renderer from 'markdown-it/lib/renderer';
import { escapeHtml } from 'markdown-it/lib/common/utils';
import { RuleCore } from 'markdown-it/lib/parser_core';
import { getStateEnv, StateEnv } from './state';

const PATTERN = /^\(([a-zA-Z0-9|@<>*./_\-+:]{1,100})\)=\s*$/; // (my_id)=

function target(state: StateBlock, startLine: number, endLine: number, silent: boolean) {
  const pos = state.bMarks[startLine] + state.tShift[startLine];
  const maximum = state.eMarks[startLine];

  // if it's indented more than 3 spaces, it should be a code block
  if (state.sCount[startLine] - state.blkIndent >= 4) return false;

  const match = PATTERN.exec(state.src.slice(pos, maximum));
  if (match == null) return false;
  if (silent) return true;

  state.line = startLine + 1;

  const token = state.push('myst_target', '', 0);
  const id = match?.[1] ?? '';
  token.attrSet('id', id);
  token.map = [startLine, state.line];

  const env = getStateEnv(state);
  env.targets[id] = {
    name: `ref-${escapeHtml(id)}`,
    internal: true,
  };

  return true;
}

const render_myst_target: Renderer.RenderRule = (tokens, idx, opts, env: StateEnv) => {
  const ref = tokens[idx].attrGet('id') ?? '';
  const name = env.targets[ref]?.name;
  return (
    `<span id="${name}"></span>\n`
  );
};


const addBlockTitles: RuleCore = (state) => {
  const { tokens } = state;
  const env = state.env as StateEnv;
  for (let index = 0; index < tokens.length; index += 1) {
    const prev = tokens[index - 1];
    const token = tokens[index];
    const next = tokens[index + 1];
    if (prev?.type === 'myst_target' && token.type === 'heading_open') {
      const id = prev.attrGet('id') ?? '';
      // TODO: Should likely have this actually be the rendered content?
      env.targets[id].title = escapeHtml(next.content);
    }
  }
  return true;
};

const updateLinkHrefs: RuleCore = (state) => {
  const { tokens } = state;
  const env = state.env as StateEnv;
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.type === 'inline' && token.children) {
      token.children.forEach((t) => {
        if (t.type === 'link_open') {
          const link = env.targets[t.attrGet('href') ?? ''];
          if (link) {
            t.attrSet('title', link.title ?? '');
            t.attrSet('href', `#${link.name}`);
          }
        }
      });
    }
  }
  return true;
};

export function myst_blocks_plugin(md: MarkdownIt) {
  md.block.ruler.before(
    'hr',
    'myst_target',
    target,
    { alt: ['paragraph', 'reference', 'blockquote', 'list', 'footnote_def'] },
  );
  md.core.ruler.after('block', 'add_block_titles', addBlockTitles);
  md.core.ruler.after('inline', 'update_link_hrefs', updateLinkHrefs);
  md.renderer.rules.myst_target = render_myst_target;
}
