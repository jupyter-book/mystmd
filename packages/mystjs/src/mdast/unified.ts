import { Root } from 'mdast';
import rehypeFormat from 'rehype-format';
import type { Plugin } from 'unified';
import { Options } from '../types';

export const formatHtml: Plugin<[Options['formatHtml']?], string, Root> = function formatHtml(opt) {
  if (!opt) return () => undefined;
  return rehypeFormat(typeof opt === 'boolean' ? {} : opt);
};
