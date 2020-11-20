/* eslint-disable no-param-reassign */
import MarkdownIt from 'markdown-it';
import container from 'markdown-it-container';
import { escapeHtml } from 'markdown-it/lib/common/utils';
import Token from 'markdown-it/lib/token';
import { RuleCore } from 'markdown-it/lib/parser_core';
import { newTarget, Target, TargetKind } from './state';

type ContainerOpts = Parameters<typeof container>[2];

const admonitionTypes = new Set(['admonition', 'attention', 'caution', 'danger', 'error', 'important', 'hint', 'note', 'seealso', 'tip', 'warning']);
const admonitionTitles = {
  attention: 'Attention', caution: 'Caution', danger: 'Danger', error: 'Error', important: 'Important', hint: 'Hint', note: 'Note', seealso: 'See Also', tip: 'Tip', warning: 'Warning',
};
const DEFAULT_ADMONITION_CLASS = 'note';
type AdmonitionTypes = keyof typeof admonitionTitles | 'admonition';
const ADMONITIONS = /^\{([a-z]*)\}\s*(.*)$/;
const QUICK_PARAMETERS = /^:([a-zA-Z0-9\-_]+):(.*)$/;

const FIGURE = /^\{figure\}\s*(.*)$/;

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


const figure: ContainerOpts = {
  marker: '`',
  validate(params) {
    const match = params.trim().match(FIGURE);
    return match != null;
  },
  render(tokens, idx) {
    const token = tokens[idx];
    if (token.nesting === 1) {
      const src = token.attrGet('src') ?? '';
      const target = token.meta.target as Target;
      return `<figure id="${target.id}" class="numbered">\n<img src="${escapeHtml(src)}">\n<figcaption number="${target.number}">\n`;
    }
    return '</figcaption>\n</figure>\n';
  },
};


function stripParams(content: string) {
  const data = {} as { [key: string]: string };
  let stopParams = false;
  const modified = content.split('\n').reduce((lines, line) => {
    const match = line.match(QUICK_PARAMETERS);
    if (stopParams || !match) {
      stopParams = true;
      return [...lines, line];
    }
    const [, key, value] = match;
    if (data[key] !== undefined) {
      console.warn(`There are multiple keys defined for ${key}: ${data[key]} and ${value.trim()}`);
    }
    data[key] = value.trim();
    return lines;
  }, [] as string[]);
  return { data, modified: modified.join('\n') };
}

function stripYaml(content: string) {
  const data = {};
  return { data, modified: content };
}

function addDirectiveOptions(parent: Token, tokens: Token[], index: number) {
  const [open, token, close] = tokens.slice(index - 1, index + 2);
  const { content } = token;
  const firstLine = content.split('\n')[0].trim();
  const isYaml = firstLine === '---';
  const isQuickParams = QUICK_PARAMETERS.test(firstLine);
  if (!isYaml && !isQuickParams) return;
  const strip = isYaml ? stripYaml : stripParams;
  const { data, modified } = strip(token.content);
  parent.meta = { ...parent.meta, attrs: data };
  token.content = modified;
  // Here we will stop the tags from rendering if there is no content that is not metadata
  // This stops empty paragraph tags from rendering.
  const noContent = modified.length === 0;
  if (open && noContent) open.hidden = true;
  token.hidden = noContent;
  if (close && noContent) close.hidden = true;
}


const cleanAdmonitions: RuleCore = (state) => {
  const { tokens } = state;
  let inContainer: Token | false = false;
  // If there is a title on the first line when not required, bump it to the first inline
  let bumpTitle = '';
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.type === 'container_admonitions_open') {
      inContainer = token;
      const match = token.info.trim().match(ADMONITIONS);
      const kind: AdmonitionTypes = match?.[1] as AdmonitionTypes;
      const title = (match?.[2] ?? '').trim();
      if (kind !== 'admonition') bumpTitle = title;
      token.attrSet('kind', kind);
      token.attrSet('title', kind === 'admonition' ? title : admonitionTitles[kind]);
    }
    if (token.type === 'container_figure_open') {
      const match = token.info.trim().match(FIGURE);
      const src = (match?.[1] ?? '').trim();
      token.attrSet('src', src);
    }
    if (token.type === 'container_admonitions_close') {
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
  let gotOptions = false;
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.type.startsWith('container_') && token.type.endsWith('_open')) {
      inContainer = token;
      gotOptions = false;
    }
    if (token.type.startsWith('container_') && token.type.endsWith('_close')) {
      if (inContainer) {
        // Ensure there is metadata always defined for containers
        inContainer.meta = { attrs: {}, ...inContainer.meta };
      }
      inContainer = false;
    }
    if (inContainer && !gotOptions && token.type === 'inline') {
      addDirectiveOptions(inContainer, tokens, index);
      gotOptions = true;
    }
  }
  return true;
};


const numberFigures: RuleCore = (state) => {
  const { tokens } = state;
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.type === 'container_figure_open') {
      const { name } = token.meta?.attrs;
      const target = newTarget(state, name, TargetKind.figure);
      token.meta.target = target;
    }
  }
  return true;
};


export function myst_directives_plugin(md: MarkdownIt) {
  md.use(container, 'admonitions', admonitions);
  md.use(container, 'figure', figure);
  md.core.ruler.after('block', 'strip_options', stripOptions);
  md.core.ruler.after('strip_options', 'clean_admonitions', cleanAdmonitions);
  md.core.ruler.after('clean_admonitions', 'number_figures', numberFigures);
}
