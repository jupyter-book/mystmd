import type MarkdownIt from 'markdown-it/lib/index.js';
import { rolePlugin } from './roles.js';
import { directivePlugin } from './directives.js';
import { citationsPlugin } from './citations.js';
import { blockPlugin } from './block.js';
import { colonFencePlugin } from './colonFence.js';

export { rolePlugin, directivePlugin, citationsPlugin, blockPlugin, colonFencePlugin };

/**
 * @deprecated
 *
 * A markdown-it plugin for parsing MyST roles and directives to structured data
 */
export function mystPlugin(md: MarkdownIt): void {
  md.use(rolePlugin);
  md.use(directivePlugin);
}

export default mystPlugin;
