import type { GenericParent } from 'myst-common';
import rehypeFormat from 'rehype-format';
import type { Plugin } from 'unified';

export const formatHtml: Plugin<[boolean?], string, GenericParent> = function formatHtml(opt) {
  if (!opt) return () => undefined;
  return rehypeFormat(typeof opt === 'boolean' ? {} : opt);
};
