import type MarkdownIt from 'markdown-it/lib';
import { rolePlugin } from './roles';
import { directivePlugin } from './directives';

export { rolePlugin };
export { directivePlugin };

/**
 * A markdown-it plugin for parsing MyST roles and directives to structured data
 */
export function mystPlugin(md: MarkdownIt): void {
  md.use(rolePlugin);
  md.use(directivePlugin);
}

export default mystPlugin;
