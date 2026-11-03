import type { Root } from 'hast';
import rehypeFormat from 'rehype-format';
import type { Plugin } from 'unified';

export const formatHtml: Plugin<[boolean?], Root> = function formatHtml(opt) {
  if (!opt) return () => undefined;
  return rehypeFormat(typeof opt === 'boolean' ? {} : opt);
};
