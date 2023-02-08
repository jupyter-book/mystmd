import type { Root } from 'mdast';
import rehypeFormat from 'rehype-format';
import type { Plugin } from 'unified';

export const formatHtml: Plugin<[boolean?], string, Root> = function formatHtml(opt) {
  if (!opt) return () => undefined;
  return rehypeFormat(typeof opt === 'boolean' ? {} : opt);
};
