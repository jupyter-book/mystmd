import type MarkdownIt from 'markdown-it/lib';
import { rolePlugin } from './roles.js';
import { directivePlugin } from './directives.js';
import { citationsPlugin } from './citations.js';

export { rolePlugin, directivePlugin, citationsPlugin };

/**
 * A markdown-it plugin for parsing MyST roles and directives to structured data
 */
export function mystPlugin(md: MarkdownIt): void {
  md.use(rolePlugin);
  md.use(directivePlugin);
}

export default mystPlugin;
