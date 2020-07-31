/* eslint-disable no-param-reassign */
import MarkdownIt from 'markdown-it';
import container from 'markdown-it-container';
import { escapeHtml } from 'markdown-it/lib/common/utils';
import Token from 'markdown-it/lib/token';
import { RuleCore } from 'markdown-it/lib/parser_core';

type ContainerOpts = Parameters<typeof container>[2];

const admonitionTypes = new Set(['admonition', 'attention', 'caution', 'danger', 'error', 'important', 'hint', 'note', 'seealso', 'tip', 'warning']);
const admonitionTitles = {
  attention: 'Attention', caution: 'Caution', danger: 'Danger', error: 'Error', important: 'Important', hint: 'Hint', note: 'Note', seealso: 'See Also', tip: 'Tip', warning: 'Warning',
};
const DEFAULT_ADMONITION_CLASS = 'note';
type AdmonitionTypes = keyof typeof admonitionTitles | 'admonition';
const ADMONITIONS = /^\{([a-z]*)\}\s*(.*)$/;
const QUICK_PARAMETERS = /^:([a-z-]+):(.*)$/;

const admonitions: ContainerOpts = {
  marker: '`',
  validate(params) {
    const match = params.trim().match(ADMONITIONS);
    return match != null && admonitionTypes.has(match[1]);
  },
  render(tokens, idx) {
    const kind = tokens[idx].attrGet('kind') ?? 'note';
    const className = kind === 'admonition' ? DEFAULT_ADMONITION_CLASS : kind;
    const title = tokens[idx].attrGet('title') ?? '';
    if (tokens[idx].nesting === 1) return `<aside class="callout ${className}"><header>${escapeHtml(title)}</header>\n`;
    return '</aside>\n';
  },
};

function stripParams(content: string) {
  const data = {};
  return { data, modified: content };
}

function stripYaml(content: string) {
  const data = {};
  return { data, modified: content };
}

function addDirectiveOptions(parent: Token, token: Token) {
  const { content } = token;
  const firstLine = content.split('\n')[0].trim();
  const isYaml = firstLine === '---';
  const isQuickParams = QUICK_PARAMETERS.test(firstLine);
  if (!isYaml && !isQuickParams) return;
  const strip = isYaml ? stripYaml : stripParams;
  const { data, modified } = strip(token.content);
  parent.meta = data;
  token.content = modified;
}


const cleanAdmonitions: RuleCore = (state) => {
  const { tokens } = state;
  let inContainer: Token | false = false;
  // If there is a title on the first line when not required, bump it to the first inline
  let bumpTitle = '';
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.type.startsWith('container_') && token.type.endsWith('_open')) {
      inContainer = token;
      const match = token.info.trim().match(ADMONITIONS);
      const kind: AdmonitionTypes = match?.[1] as AdmonitionTypes;
      const title = (match?.[2] ?? '').trim();
      if (kind !== 'admonition') bumpTitle = title;
      token.attrSet('kind', kind);
      token.attrSet('title', kind === 'admonition' ? title : admonitionTitles[kind]);
    }
    if (token.type.startsWith('container_') && token.type.endsWith('_close')) {
      // TODO: https://github.com/executablebooks/MyST-Parser/issues/154
      // If the bumped title needs to be rendered - put it here somehow.
      bumpTitle = '';
      inContainer = false;
    }
    if (inContainer && bumpTitle && token.type === 'inline') {
      token.content = `${bumpTitle} ${token.content}`;
      bumpTitle = '';
    }
  }
  return true;
};

const stripOptions: RuleCore = (state) => {
  const { tokens } = state;
  let inContainer: Token | false = false;
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.type.startsWith('container_') && token.type.endsWith('_open')) inContainer = token;
    if (token.type.startsWith('container_') && token.type.endsWith('_close')) inContainer = false;
    if (inContainer && token.type === 'inline') {
      addDirectiveOptions(inContainer, token);
    }
  }
  return true;
};

export function myst_directives_plugin(md: MarkdownIt) {
  md.use(container, 'admonitions', admonitions);
  md.core.ruler.after('block', 'strip_options', stripOptions);
  md.core.ruler.after('strip_options', 'clean_admonitions', cleanAdmonitions);
}
