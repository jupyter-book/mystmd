import { Root } from 'mdast';
import rehypeFormat from 'rehype-format';
import type { Plugin } from 'unified';
import { MyST, Options } from '../myst';

export const jsonParser: Plugin<void[], string, Root> = function jsonParser() {
  this.Parser = (json: string) => JSON.parse(json);
};

export const mystParser: Plugin<[Options?] | void[], string, Root> =
  function mystParser() {
    this.Parser = (content: string, opts?: Options) => {
      return new MyST(opts).parse(content);
    };
  };

export const formatHtml: Plugin<[Options['formatHtml']?], string, Root> =
  function formatHtml(opt) {
    if (!opt) return () => undefined;
    return rehypeFormat(typeof opt === 'boolean' ? {} : opt);
  };
