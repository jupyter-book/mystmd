import type MarkdownIt from 'markdown-it';
import type StateCore from 'markdown-it/lib/rules_core/state_core.js';

export { default as frontMatterPlugin } from 'markdown-it-front-matter';
export { default as footnotePlugin } from 'markdown-it-footnote';
export { default as tasklistPlugin } from 'markdown-it-task-lists';
export { default as deflistPlugin } from 'markdown-it-deflist';
export { mystPlugin } from 'markdown-it-myst';
export { mystBlockPlugin, colonFencePlugin } from 'markdown-it-myst-extras';
export type { MathExtensionOptions } from './math.js';
export { plugin as mathPlugin } from './math.js';

/** Markdown-it plugin to convert the front-matter token to a renderable token, for previews */
export function convertFrontMatter(md: MarkdownIt) {
  md.core.ruler.after('block', 'convert_front_matter', (state: StateCore) => {
    if (state.tokens.length && state.tokens[0].type === 'front_matter') {
      const replace = new state.Token('fence', 'code', 0);
      replace.map = state.tokens[0].map;
      replace.info = 'yaml';
      replace.content = state.tokens[0].meta;
      state.tokens[0] = replace;
    }
    return true;
  });
}
