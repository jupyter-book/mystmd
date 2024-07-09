import type MarkdownIt from 'markdown-it/lib';
import { rolePlugin } from './roles.js';
import { directivePlugin } from './directives.js';
import { citationsPlugin } from './citations.js';
import { labelsPlugin } from './labels.js';
import { shortcodePlugin } from './shortcode.js';
import { spanPlugin } from './span.js';

export { rolePlugin, directivePlugin, citationsPlugin, shortcodePlugin, labelsPlugin };

/**
 * A markdown-it plugin for parsing MyST roles and directives to structured data
 */
export function mystPlugin(md: MarkdownIt): void {
  md.use(rolePlugin);
  md.use(directivePlugin);
}

export default mystPlugin;
