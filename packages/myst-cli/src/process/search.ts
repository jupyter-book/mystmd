import type { GenericNode } from 'myst-common';
import type { DocumentHierarchy } from 'myst-spec-ext';
import type { Heading } from 'myst-spec';
import { toText } from 'myst-common';
import { visit, SKIP } from 'unist-util-visit';

export type HeadingInfo = {
  text: string;
  depth: number;
  html_id?: string;
};

export type Section = {
  heading?: HeadingInfo;
  parts: string[];
};

export function toSectionedParts(content: GenericNode) {
  const sections: Section[] = [];
  const newSection = (heading?: Heading) => {
    const info = heading
      ? {
          text: toText(heading),
          depth: heading.depth,
          html_id: (heading as GenericNode).html_id ?? heading.identifier,
        }
      : undefined;
    sections.push({ heading: info, parts: [] });
  };
  newSection();
  visit(
    content,
    (node: GenericNode, index: number | undefined, parent: GenericNode | undefined) => {
      if (node.type === 'heading') {
        newSection(node as Heading);
        return SKIP;
      }
      // deny-list
      if (node.type === 'myst') {
        return SKIP;
      }
      const section = sections[sections.length - 1];

      // Literals are fused together
      if ('value' in node && node.value) {
        section.parts.push(node.value);
        // Final children of paragraphs are separated by newlines
        if (
          parent &&
          parent.children &&
          index &&
          parent.type === 'paragraph' &&
          index === parent.children.length - 1
        ) {
          section.parts.push('\n');
        }
      }
    },
  );
  return sections;
}

/**
 * Determine the "level" of a heading as a literal type
 *
 * @param heading - heading info object
 */
export function sectionToHeadingLevel(heading: HeadingInfo | undefined): keyof DocumentHierarchy {
  if (!heading) {
    return 'lvl1';
  }
  switch (heading.depth) {
    case 2:
      return 'lvl2';
    case 3:
      return 'lvl3';
    case 4:
      return 'lvl4';
    case 5:
      return 'lvl5';
    case 6:
      return 'lvl6';
    default:
      throw new Error(`unknown heading depth: ${heading.depth}`);
  }
}

/**
 * Build a DocumentHierarchy object describing the hierarchy of headings
 * in an array of appearance-ordered sections.
 *
 * @param title - document title
 * @param sections - array of section
 * @param index - current section position
 */
export function buildHierarchy(
  title: string | undefined,
  sections: Section[],
  index: number,
): DocumentHierarchy {
  const result: DocumentHierarchy = { lvl1: title };
  let currentDepth = 100;

  // The first section is always the title section
  for (let i = index; i > 0; i--) {
    const { heading } = sections[i];
    if (heading === undefined) {
      throw new Error();
    }
    if (heading.depth >= currentDepth) {
      continue;
    }
    const lvl = sectionToHeadingLevel(heading);

    result[lvl] = heading.text!;
    currentDepth = heading.depth;
  }
  return result;
}
