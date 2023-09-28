import type { Plugin } from 'unified';
import type { GenericParent } from 'myst-common';
import { toText } from 'myst-common';
import { selectAll } from 'unist-util-select';
import type { Abbreviation, Text } from 'myst-spec';
import { u } from 'unist-builder';
import type { FindAndReplaceSchema, RegExpMatchObject } from 'mdast-util-find-and-replace';
import { findAndReplace } from 'mdast-util-find-and-replace';

type Options = {
  /** An object of abbreviations { "TLA": "Three Letter Acronym" } */
  abbreviations?: Record<string, string>;
  /**
   * Expand the abbreviation the first time it is encountered,
   *
   * i.e. `TLA` --> `Three Letter Acronym (TLA)`
   */
  firstTimeLong?: boolean;
};

// We will not replace abbreviation text inside of these nodes
const doNotModifyParents = new Set(['link', 'crossReference', 'cite', 'code', 'abbreviation']);

function replaceText(mdast: GenericParent, opts: Options) {
  if (!opts?.abbreviations || Object.keys(opts.abbreviations).length === 0) return;
  const replacements: FindAndReplaceSchema = Object.fromEntries(
    Object.entries(opts.abbreviations)
      .filter(([abbr]) => abbr.length > 1) // We can't match on single characters!
      .map(([abbr, title]) => [
        abbr,
        (value: any, { stack }: RegExpMatchObject) => {
          if (stack.slice(-1)[0].type !== 'text') return false;
          const parent = stack.find((p) => doNotModifyParents.has(p.type));
          if (parent) return false;
          return u('abbreviation', { title }, [u('text', value)]) as any;
        },
      ]),
  );
  findAndReplace(mdast as any, replacements);
}

export function abbreviationTransform(mdast: GenericParent, opts?: Options) {
  if (!opts?.abbreviations || Object.keys(opts.abbreviations).length === 0) return;
  const abbreviations = selectAll('abbreviation', mdast) as Abbreviation[];
  abbreviations.forEach((node) => {
    if (node.title) return;
    const abbr = toText(node);
    const title = opts.abbreviations?.[abbr];
    if (title) node.title = title;
  });
  replaceText(mdast, opts);

  if (opts.firstTimeLong) {
    const new_abbreviations = selectAll('abbreviation', mdast) as Abbreviation[];
    const explained = new Set();
    new_abbreviations.forEach((node) => {
      if (explained.has(node.title)) return;
      explained.add(node.title);
      const short = node.children[0] as unknown as Text;
      short.value = `${node.title} (${short.value})`;
    });
  }
}

export const abbreviationPlugin: Plugin<[Options], GenericParent, GenericParent> =
  (opts) => (tree) => {
    abbreviationTransform(tree, opts);
  };
