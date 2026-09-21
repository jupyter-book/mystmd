import type { Plugin } from 'unified';
import type { GenericParent } from 'myst-common';
import { toText } from 'myst-common';
import { selectAll } from 'unist-util-select';
import type { Abbreviation, Text } from 'myst-spec';
import { u } from 'unist-builder';
import type { FindAndReplaceSchema, RegExpMatchObject } from 'mdast-util-find-and-replace';
import { findAndReplace } from 'mdast-util-find-and-replace';

type AbbreviationMap = Record<string, string | null>;

type Options = {
  /** An object of abbreviations { "TLA": "Three Letter Acronym" } */
  abbreviations?: Record<string, string | boolean | null>;
  /**
   * Expand the abbreviation the first time it is encountered,
   *
   * i.e. `TLA` --> `Three Letter Acronym (TLA)`
   *
   * This can also be set with the reserved `firstTimeLong` key in `abbreviations`.
   */
  firstTimeLong?: boolean;
};

/** Reserved abbreviations-map key that enables first-instance expansion. */
const FIRST_TIME_LONG_KEY = 'firstTimeLong';

// We will not replace abbreviation text inside of these nodes
const doNotModifyParents = new Set(['link', 'crossReference', 'cite', 'code', 'abbreviation']);

function isFirstTimeLongFlag(value: string | boolean | null | undefined): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return undefined;
}

function resolveAbbreviationOptions(opts?: Options): {
  abbreviations: AbbreviationMap;
  firstTimeLong: boolean;
} {
  const abbreviations: AbbreviationMap = {};
  let firstTimeLong = Boolean(opts?.firstTimeLong);
  Object.entries(opts?.abbreviations ?? {}).forEach(([key, value]) => {
    if (key === FIRST_TIME_LONG_KEY) {
      const flag = isFirstTimeLongFlag(value);
      if (flag != null) firstTimeLong = flag;
      return;
    }
    if (typeof value === 'boolean') return;
    abbreviations[key] = value;
  });
  return { abbreviations, firstTimeLong };
}

function replaceText(mdast: GenericParent, abbreviations: AbbreviationMap) {
  if (Object.keys(abbreviations).length === 0) return;
  const replacements: FindAndReplaceSchema = Object.fromEntries(
    Object.entries(abbreviations)
      .filter(([abbr]) => abbr.length > 1) // We can't match on single characters!
      .sort((a, b) => b[0].length - a[0].length || a[0].localeCompare(b[0])) // Sort by length (longest-first) then locale-ordering
      .map(([abbr, title]) => [
        abbr,
        (value: any, { stack }: RegExpMatchObject) => {
          if (!title) {
            // Change the type of this match to a transient node to guard from further replacements
            return u('__skippedAbbreviation__', value);
          }
          if (stack.slice(-1)[0].type !== 'text') return false;
          const parent = stack.find((p) => doNotModifyParents.has(p.type));
          if (parent) return false;
          return u('abbreviation', { title }, [u('text', value)]);
        },
      ]),
  );
  findAndReplace(mdast as any, replacements);
  // Restore the original `text` type of the transient replacements performed above
  selectAll('__skippedAbbreviation__', mdast).forEach((n) => {
    n.type = 'text';
  });
}

function expandFirstAbbreviationInstances(mdast: GenericParent) {
  const explained = new Set<string>();
  (selectAll('abbreviation', mdast) as Abbreviation[]).forEach((node) => {
    if (!node.title) return;
    const short = node.children?.[0] as Text | undefined;
    if (!short || short.type !== 'text' || !short.value) return;
    if (explained.has(short.value)) return;
    explained.add(short.value);
    short.value = `${node.title} (${short.value})`;
  });
}

export function abbreviationTransform(mdast: GenericParent, opts?: Options) {
  const { abbreviations, firstTimeLong } = resolveAbbreviationOptions(opts);
  const hasAbbreviations = Object.keys(abbreviations).length > 0;
  if (!hasAbbreviations && !firstTimeLong) return;

  if (hasAbbreviations) {
    // Inline abbreviations have lower priority to passed-in abbreviations
    // So, we replace conflicting titles with those that have been passed-in
    const abbreviationNodes = selectAll('abbreviation', mdast) as Abbreviation[];
    abbreviationNodes.forEach((node) => {
      if (node.title) return;
      const abbr = toText(node);
      const title = abbreviations[abbr];
      if (title) node.title = title;
    });

    // Replace instances of abbreviated constructs with their titles
    replaceText(mdast, abbreviations);
  }

  if (firstTimeLong) {
    expandFirstAbbreviationInstances(mdast);
  }
}

export const abbreviationPlugin: Plugin<[Options], GenericParent, GenericParent> =
  (opts) => (tree) => {
    abbreviationTransform(tree, opts);
  };
